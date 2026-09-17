import type { UserRole } from "@prisma/client";
import { normalizeEmail, validateNewPassword } from "./auth.js";

export const userRoles = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"] as const satisfies readonly UserRole[];
export const operationalTicketStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] as const;

export const adminUserSelect = {
  id: true,
  displayName: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  credentialVersion: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AdminUserInput = {
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

type Validation = { value?: AdminUserInput; fieldErrors?: Record<string, string> };

export function validateUserListQuery(query: Record<string, unknown>): { value?: { search?: string; role?: UserRole } } {
  const keys = Object.keys(query);
  if (keys.some((key) => key !== "search" && key !== "role")) return {};
  if (Array.isArray(query.search) || Array.isArray(query.role)) return {};

  let search: string | undefined;
  if (query.search !== undefined) {
    if (typeof query.search !== "string") return {};
    search = query.search.trim();
    if (!search || search.length > 120) return {};
  }

  let role: UserRole | undefined;
  if (query.role !== undefined) {
    if (typeof query.role !== "string" || !userRoles.includes(query.role as UserRole)) return {};
    role = query.role as UserRole;
  }
  return { value: { ...(search ? { search } : {}), ...(role ? { role } : {}) } };
}

export function validateUserCreate(body: unknown): Validation & { initialPassword?: string } {
  if (!isObjectWithOnly(body, ["displayName", "email", "role", "isActive", "initialPassword"])) return { fieldErrors: { form: "Provide only the required user fields." } };
  const base = validateBaseUser(body);
  const passwordError = validateNewPassword(body.initialPassword);
  if (passwordError) return { fieldErrors: { ...(base.fieldErrors ?? {}), initialPassword: passwordError } };
  if (!base.value) return base;
  return { value: base.value, initialPassword: body.initialPassword as string };
}

export function validateUserEdit(body: unknown): Validation & { version?: number } {
  if (!isObjectWithOnly(body, ["displayName", "email", "role", "isActive", "version"])) return { fieldErrors: { form: "Provide only editable user fields." } };
  const base = validateBaseUser(body);
  const version = positiveVersion(body.version);
  if (!version) return { fieldErrors: { ...(base.fieldErrors ?? {}), version: "Reload this user and try again." } };
  return base.value ? { value: base.value, version } : { fieldErrors: base.fieldErrors };
}

export function validateInitialPasswordReset(body: unknown): { value?: { initialPassword: string; version: number }; fieldErrors?: Record<string, string> } {
  if (!isObjectWithOnly(body, ["initialPassword", "version"])) return { fieldErrors: { form: "Provide only an initial password and version." } };
  const errors: Record<string, string> = {};
  const passwordError = validateNewPassword(body.initialPassword);
  if (passwordError) errors.initialPassword = passwordError;
  const version = positiveVersion(body.version);
  if (!version) errors.version = "Reload this user and try again.";
  return Object.keys(errors).length ? { fieldErrors: errors } : { value: { initialPassword: body.initialPassword as string, version: version! } };
}

function validateBaseUser(body: Record<string, unknown>): Validation {
  const fieldErrors: Record<string, string> = {};
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName || displayName.length > 100) fieldErrors.displayName = "Enter a name from 1 to 100 characters.";
  const email = normalizeEmail(body.email);
  if (!email) fieldErrors.email = "Enter a valid email address.";
  const role = typeof body.role === "string" && userRoles.includes(body.role as UserRole) ? body.role as UserRole : undefined;
  if (!role) fieldErrors.role = "Choose one valid role.";
  if (typeof body.isActive !== "boolean") fieldErrors.isActive = "Choose whether the account is active.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return { value: { displayName, email: email!, role: role!, isActive: body.isActive as boolean } };
}

function positiveVersion(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function isObjectWithOnly(value: unknown, keys: string[]): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}
