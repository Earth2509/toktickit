import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { UserRole } from "@prisma/client";
import { getPrisma } from "./prisma.js";

const sessionCookieName = "toktickit_session";
const sessionLifetimeMilliseconds = 8 * 60 * 60 * 1000;
const rateLimitWindowMilliseconds = 15 * 60 * 1000;
const passwordKeyLength = 64;
const passwordSaltLength = 16;
const passwordParameters = { N: 32_768, r: 8, p: 3, maxmem: 128 * 1024 * 1024 };

type SafeUser = {
  id: number;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  credentialVersion: number;
};

type StoredUser = SafeUser & { passwordHash: string | null };

export type AuthContext = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
  user: SafeUser;
};

type RateLimitBucket = Map<string, { failures: number; resetAt: number }>;
const loginEmailFailures: RateLimitBucket = new Map();
const loginAddressFailures: RateLimitBucket = new Map();
const currentPasswordUserFailures: RateLimitBucket = new Map();
const currentPasswordAddressFailures: RateLimitBucket = new Map();
let dummyPasswordHash: Promise<string> | undefined;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(passwordSaltLength);
  const key = await deriveScryptKey(password, salt);
  return [
    "scrypt",
    "1",
    String(passwordParameters.N),
    String(passwordParameters.r),
    String(passwordParameters.p),
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const parts = passwordHash.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt" || parts[1] !== "1") return false;

  const [N, r, p] = parts.slice(2, 5).map(Number);
  if (N !== passwordParameters.N || r !== passwordParameters.r || p !== passwordParameters.p) return false;

  try {
    const salt = Buffer.from(parts[5], "base64url");
    const expected = Buffer.from(parts[6], "base64url");
    if (salt.length !== passwordSaltLength || expected.length !== passwordKeyLength) return false;
    const actual = await deriveScryptKey(password, salt);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function validateNewPassword(value: unknown): string | undefined {
  if (typeof value !== "string") return "Enter a password.";
  const codePoints = Array.from(value);
  if (codePoints.length < 12 || codePoints.length > 128) return "Use 12 to 128 characters.";
  if (value.trim().length === 0) return "The password cannot contain only whitespace.";
  return undefined;
}

export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 254) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) ? normalized : undefined;
}

export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  if (!hasTrustedOrigin(req)) {
    return sendError(res, 403, "FORBIDDEN", "This request origin is not trusted.");
  }
  next();
};

export const requireAuthenticatedUser: RequestHandler = async (req, res, next) => {
  const context = await getAuthenticatedContext(req);
  if (!context) return sendError(res, 401, "UNAUTHENTICATED", "Your session is no longer valid.");
  res.locals.auth = context;
  res.setHeader("Cache-Control", "no-store");
  next();
};

export const requireCsrfToken: RequestHandler = (req, res, next) => {
  const context = res.locals.auth as AuthContext | undefined;
  if (!context || !isValidCsrfToken(req.get("x-csrf-token"), context.tokenHash)) {
    return sendError(res, 403, "FORBIDDEN", "The CSRF token is missing or invalid.");
  }
  next();
};

export async function login(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const input = credentialInput(req.body);
  if (!input) return sendError(res, 422, "VALIDATION_ERROR", "Email and password are required.", {
    email: "Enter a valid email address.",
    password: "Enter a password.",
  });

  const sourceAddress = sourceAddressFor(req);
  const retryAfter = rateLimitRetryAfter([
    [loginEmailFailures, input.email, 5],
    [loginAddressFailures, sourceAddress, 30],
  ]);
  if (retryAfter !== undefined) return sendRateLimited(res, retryAfter);

  let user: StoredUser | null = null;
  try {
    user = await getPrisma().user.findUnique({
      where: { email: input.email },
      select: storedUserSelect,
    });
  } catch {
    return sendError(res, 503, "UNAVAILABLE", "Authentication is temporarily unavailable.");
  }

  const comparisonHash = user?.passwordHash ?? await getDummyPasswordHash();
  const passwordMatches = await verifyPassword(input.password, comparisonHash);
  if (!user || !user.passwordHash || !passwordMatches) {
    recordFailure(loginEmailFailures, input.email);
    recordFailure(loginAddressFailures, sourceAddress);
    return sendError(res, 401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  if (!user.isActive) {
    recordFailure(loginEmailFailures, input.email);
    recordFailure(loginAddressFailures, sourceAddress);
    return sendError(res, 403, "ACCOUNT_INACTIVE", "This account is deactivated. Contact your administrator.");
  }

  clearFailure(loginEmailFailures, input.email);
  clearFailure(loginAddressFailures, sourceAddress);
  const context = await createSession(user);
  setSessionCookie(res, context.token);
  return res.status(200).json(authDto(context));
}

export async function currentUser(_req: Request, res: Response) {
  const context = res.locals.auth as AuthContext;
  return res.status(200).json(authDto(context));
}

export async function changePassword(req: Request, res: Response) {
  const context = res.locals.auth as AuthContext;
  const input = changePasswordInput(req.body);
  if (!input) return sendError(res, 422, "VALIDATION_ERROR", "Password change input is invalid.", {
    currentPassword: "Enter your current password.",
    newPassword: "Enter a valid new password.",
    confirmPassword: "Confirm the new password.",
  });

  const newPasswordError = validateNewPassword(input.newPassword);
  if (newPasswordError || input.newPassword !== input.confirmPassword) {
    return sendError(res, 422, "VALIDATION_ERROR", "Password change input is invalid.", {
      ...(newPasswordError ? { newPassword: newPasswordError } : {}),
      ...(input.newPassword !== input.confirmPassword ? { confirmPassword: "The confirmation does not match the new password." } : {}),
    });
  }

  const sourceAddress = sourceAddressFor(req);
  const retryAfter = rateLimitRetryAfter([
    [currentPasswordUserFailures, String(context.user.id), 5],
    [currentPasswordAddressFailures, sourceAddress, 30],
  ]);
  if (retryAfter !== undefined) return sendRateLimited(res, retryAfter);

  const user = await getPrisma().user.findUnique({ where: { id: context.user.id }, select: storedUserSelect });
  if (!user || !user.isActive || user.credentialVersion !== context.user.credentialVersion || !user.passwordHash) {
    return sendError(res, 401, "UNAUTHENTICATED", "Your session is no longer valid.");
  }

  const currentPasswordMatches = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    recordFailure(currentPasswordUserFailures, String(context.user.id));
    recordFailure(currentPasswordAddressFailures, sourceAddress);
    return sendError(res, 422, "VALIDATION_ERROR", "Password change input is invalid.", {
      currentPassword: "The current password is incorrect.",
    });
  }

  if (await verifyPassword(input.newPassword, user.passwordHash)) {
    return sendError(res, 422, "VALIDATION_ERROR", "Password change input is invalid.", {
      newPassword: "The new password must differ from the current password.",
    });
  }

  const replacementHash = await hashPassword(input.newPassword);
  const replacementToken = randomBytes(32).toString("base64url");
  const replacementTokenHash = hashSessionToken(replacementToken);
  const expiresAt = new Date(Date.now() + sessionLifetimeMilliseconds);

  const replacementUser = await getPrisma().$transaction(async (transaction) => {
    const updatedUser = await transaction.user.update({
      where: { id: user.id },
      data: {
        passwordHash: replacementHash,
        mustChangePassword: false,
        credentialVersion: { increment: 1 },
      },
      select: safeUserSelect,
    });
    await transaction.session.deleteMany({ where: { userId: user.id } });
    await transaction.session.create({
      data: {
        tokenHash: replacementTokenHash,
        userId: user.id,
        credentialVersion: updatedUser.credentialVersion,
        expiresAt,
      },
    });
    return updatedUser;
  });

  clearFailure(currentPasswordUserFailures, String(context.user.id));
  clearFailure(currentPasswordAddressFailures, sourceAddress);
  const replacementContext: AuthContext = {
    token: replacementToken,
    tokenHash: replacementTokenHash,
    expiresAt,
    user: replacementUser,
  };
  setSessionCookie(res, replacementToken);
  return res.status(200).json(authDto(replacementContext));
}

export async function logout(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  const context = await getAuthenticatedContext(req);
  if (context && !isValidCsrfToken(req.get("x-csrf-token"), context.tokenHash)) {
    return sendError(res, 403, "FORBIDDEN", "The CSRF token is missing or invalid.");
  }

  if (context) await getPrisma().session.deleteMany({ where: { tokenHash: context.tokenHash } });
  clearSessionCookie(res);
  return res.status(204).end();
}

export function resetAuthRateLimits() {
  loginEmailFailures.clear();
  loginAddressFailures.clear();
  currentPasswordUserFailures.clear();
  currentPasswordAddressFailures.clear();
}

async function getAuthenticatedContext(req: Request): Promise<AuthContext | undefined> {
  const token = sessionTokenFrom(req);
  if (!token) return undefined;

  const tokenHash = hashSessionToken(token);
  const session = await getPrisma().session.findUnique({
    where: { tokenHash },
    include: { user: { select: safeUserSelect } },
  });
  if (!session) return undefined;

  if (session.expiresAt <= new Date() || !session.user.isActive || session.credentialVersion !== session.user.credentialVersion) {
    await getPrisma().session.deleteMany({ where: { tokenHash } });
    return undefined;
  }

  return { token, tokenHash, expiresAt: session.expiresAt, user: session.user };
}

async function createSession(user: SafeUser): Promise<AuthContext> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionLifetimeMilliseconds);
  await getPrisma().session.create({
    data: { tokenHash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt },
  });
  return { token, tokenHash, expiresAt, user };
}

function credentialInput(value: unknown): { email: string; password: string } | undefined {
  if (!isPlainObject(value) || !hasOnlyKeys(value, ["email", "password"])) return undefined;
  const email = normalizeEmail(value.email);
  return email && typeof value.password === "string" ? { email, password: value.password } : undefined;
}

function changePasswordInput(value: unknown): { currentPassword: string; newPassword: string; confirmPassword: string } | undefined {
  if (!isPlainObject(value) || !hasOnlyKeys(value, ["currentPassword", "newPassword", "confirmPassword"])) return undefined;
  const { currentPassword, newPassword, confirmPassword } = value;
  return typeof currentPassword === "string" && typeof newPassword === "string" && typeof confirmPassword === "string"
    ? { currentPassword, newPassword, confirmPassword }
    : undefined;
}

function hasTrustedOrigin(req: Request): boolean {
  const origin = req.get("origin");
  if (!origin) return false;
  return trustedOrigins().has(origin);
}

function trustedOrigins(): Set<string> {
  const configured = process.env.TRUSTED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:4173";
  return new Set(configured.split(",").map((origin) => origin.trim()).filter(Boolean));
}

function authDto(context: AuthContext) {
  return {
    user: safeUserDto(context.user),
    csrfToken: csrfTokenFor(context.tokenHash),
    expiresAt: context.expiresAt.toISOString(),
  };
}

function safeUserDto(user: SafeUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}

function csrfTokenFor(tokenHash: string): string {
  const secret = process.env.AUTH_CSRF_SECRET;
  if (!secret) throw new Error("AUTH_CSRF_SECRET must be configured.");
  return createHmac("sha256", secret).update(tokenHash).digest("base64url");
}

function isValidCsrfToken(value: string | undefined, tokenHash: string): boolean {
  if (!value) return false;
  const expected = Buffer.from(csrfTokenFor(tokenHash));
  const actual = Buffer.from(value);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function setSessionCookie(res: Response, token: string) {
  const secure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  const attributes = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${Math.floor(sessionLifetimeMilliseconds / 1000)}`,
    ...(secure ? ["Secure"] : []),
  ];
  res.append("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(res: Response) {
  res.append("Set-Cookie", `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function sessionTokenFrom(req: Request): string | undefined {
  const rawCookie = req.get("cookie");
  if (!rawCookie) return undefined;
  const cookie = rawCookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  if (!cookie) return undefined;
  try {
    return decodeURIComponent(cookie.slice(sessionCookieName.length + 1));
  } catch {
    return undefined;
  }
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function recordFailure(bucket: RateLimitBucket, key: string) {
  const now = Date.now();
  const existing = bucket.get(key);
  if (!existing || existing.resetAt <= now) {
    bucket.set(key, { failures: 1, resetAt: now + rateLimitWindowMilliseconds });
  } else {
    existing.failures += 1;
  }
}

function clearFailure(bucket: RateLimitBucket, key: string) {
  bucket.delete(key);
}

function rateLimitRetryAfter(limits: Array<[RateLimitBucket, string, number]>): number | undefined {
  const now = Date.now();
  let retryAfter: number | undefined;
  for (const [bucket, key, maxFailures] of limits) {
    const record = bucket.get(key);
    if (!record) continue;
    if (record.resetAt <= now) {
      bucket.delete(key);
      continue;
    }
    if (record.failures >= maxFailures) {
      retryAfter = Math.max(retryAfter ?? 0, Math.ceil((record.resetAt - now) / 1000));
    }
  }
  return retryAfter;
}

function sendRateLimited(res: Response, retryAfter: number) {
  res.setHeader("Retry-After", String(retryAfter));
  return sendError(res, 429, "RATE_LIMITED", "Too many attempts. Please try again later.");
}

function sendError(res: Response, status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
  return res.status(status).json({ code, message, ...(fieldErrors && Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}) });
}

function sourceAddressFor(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key)) && allowed.every((key) => key in value);
}

function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword("TokTickIT dummy password that is never accepted");
  return dummyPasswordHash;
}

function deriveScryptKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, passwordKeyLength, passwordParameters, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

const safeUserSelect = {
  id: true,
  displayName: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  credentialVersion: true,
} as const;

const storedUserSelect = { ...safeUserSelect, passwordHash: true } as const;
