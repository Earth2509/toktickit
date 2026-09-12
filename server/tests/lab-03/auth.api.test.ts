import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, resetAuthRateLimits } from "../../src/auth.js";

type TestUser = {
  id: number;
  displayName: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
  mustChangePassword: boolean;
  credentialVersion: number;
  passwordHash: string | null;
};

type TestSession = {
  tokenHash: string;
  userId: number;
  credentialVersion: number;
  expiresAt: Date;
};

const state = vi.hoisted(() => ({
  users: new Map<number, TestUser>(),
  sessions: new Map<string, TestSession>(),
}));

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({ getPrisma: () => prisma }));

import { app } from "../../src/app.js";

const origin = "http://localhost:5173";

beforeEach(async () => {
  process.env.AUTH_CSRF_SECRET = "test-only-csrf-secret";
  process.env.TRUSTED_ORIGINS = origin;
  resetAuthRateLimits();
  state.users.clear();
  state.sessions.clear();

  const passwordHash = await hashPassword("Lab3-Demo-Only!2026");
  state.users.set(1, user({ id: 1, email: "requester1@example.test", passwordHash }));
  state.users.set(2, user({ id: 2, email: "requester-inactive@example.test", passwordHash, isActive: false }));

  prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id?: number; email?: string } }) => {
    if (where.id !== undefined) return state.users.get(where.id) ?? null;
    return [...state.users.values()].find((candidate) => candidate.email === where.email) ?? null;
  });
  prisma.user.update.mockImplementation(async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
    const existing = state.users.get(where.id);
    if (!existing) throw new Error("missing test user");
    const credentialVersion = typeof data.credentialVersion === "object" && data.credentialVersion !== null
      && "increment" in data.credentialVersion
      ? existing.credentialVersion + Number(data.credentialVersion.increment)
      : existing.credentialVersion;
    const updated = {
      ...existing,
      ...(typeof data.passwordHash === "string" ? { passwordHash: data.passwordHash } : {}),
      ...(typeof data.mustChangePassword === "boolean" ? { mustChangePassword: data.mustChangePassword } : {}),
      credentialVersion,
    };
    state.users.set(where.id, updated);
    return updated;
  });
  prisma.session.create.mockImplementation(async ({ data }: { data: TestSession }) => {
    state.sessions.set(data.tokenHash, data);
    return data;
  });
  prisma.session.findUnique.mockImplementation(async ({ where }: { where: { tokenHash: string } }) => {
    const session = state.sessions.get(where.tokenHash);
    if (!session) return null;
    const sessionUser = state.users.get(session.userId);
    return sessionUser ? { ...session, user: sessionUser } : null;
  });
  prisma.session.deleteMany.mockImplementation(async ({ where }: { where: { tokenHash?: string; userId?: number } }) => {
    for (const [tokenHash, session] of state.sessions) {
      if (where.tokenHash === tokenHash || where.userId === session.userId) state.sessions.delete(tokenHash);
    }
    return { count: 1 };
  });
  prisma.$transaction.mockImplementation(async (callback: (transaction: typeof prisma) => Promise<unknown>) => callback(prisma));
});

describe("Lab 3 authentication API", () => {
  it("logs in an active fixture user, exposes /me, and revokes the session on logout", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "requester1@example.test", password: "Lab3-Demo-Only!2026" })
      .expect(200);

    expect(login.headers["cache-control"]).toBe("no-store");
    expect(login.body.user).toMatchObject({ email: "requester1@example.test", mustChangePassword: true });
    expect(login.body.csrfToken).toEqual(expect.any(String));
    const cookie = sessionCookie(login);

    await request(app).get("/api/auth/me").set("Cookie", cookie).expect(200).expect(({ body }) => {
      expect(body.user.email).toBe("requester1@example.test");
      expect(body.csrfToken).toBe(login.body.csrfToken);
    });

    await request(app)
      .post("/api/auth/logout")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", login.body.csrfToken)
      .expect(204);

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(401)
      .expect(({ body }) => expect(body).toMatchObject({ code: "UNAUTHENTICATED" }));
  });

  it("uses safe failures for unknown credentials and only names inactive status after a matching password", async () => {
    await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "missing@example.test", password: "Lab3-Demo-Only!2026" })
      .expect(401)
      .expect({ code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });

    const inactive = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "requester-inactive@example.test", password: "Lab3-Demo-Only!2026" })
      .expect(403);

    expect(inactive.body.code).toBe("ACCOUNT_INACTIVE");
    expect(inactive.headers["set-cookie"]).toBeUndefined();
  });

  it("rotates all sessions only after a valid current-password change", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "requester1@example.test", password: "Lab3-Demo-Only!2026" })
      .expect(200);
    const cookie = sessionCookie(login);

    await request(app)
      .post("/api/auth/change-password")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", login.body.csrfToken)
      .send({ currentPassword: "incorrect current password", newPassword: "New local password 2026!", confirmPassword: "New local password 2026!" })
      .expect(422)
      .expect(({ body }) => expect(body.fieldErrors.currentPassword).toBe("The current password is incorrect."));

    const changed = await request(app)
      .post("/api/auth/change-password")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", login.body.csrfToken)
      .send({ currentPassword: "Lab3-Demo-Only!2026", newPassword: "New local password 2026!", confirmPassword: "New local password 2026!" })
      .expect(200);

    expect(changed.body.user.mustChangePassword).toBe(false);
    expect(sessionCookie(changed)).not.toBe(cookie);
    await request(app).get("/api/auth/me").set("Cookie", cookie).expect(401);
    await request(app).get("/api/auth/me").set("Cookie", sessionCookie(changed)).expect(200);
  });

  it("rejects untrusted mutation origins and throttles the sixth failed login", async () => {
    await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://untrusted.example.test")
      .send({ email: "requester1@example.test", password: "Lab3-Demo-Only!2026" })
      .expect(403)
      .expect({ code: "FORBIDDEN", message: "This request origin is not trusted." });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: "requester1@example.test", password: "wrong password for throttle" })
        .expect(401);
    }

    const throttled = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: "requester1@example.test", password: "wrong password for throttle" })
      .expect(429);
    expect(throttled.headers["retry-after"]).toMatch(/^\d+$/);
  });

  it("routes unexpected asynchronous session lookup failures through the safe error handler", async () => {
    prisma.session.findUnique.mockRejectedValueOnce(new Error("simulated database failure"));

    await request(app)
      .get("/api/auth/me")
      .set("Cookie", "toktickit_session=opaque-test-token")
      .expect(500)
      .expect({ message: "Unable to complete the request" });
  });
});

function user({ id, email, passwordHash, ...overrides }: Partial<TestUser> & Pick<TestUser, "id" | "email" | "passwordHash">): TestUser {
  return {
    id,
    displayName: "Test Requester",
    email,
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: true,
    credentialVersion: 1,
    passwordHash,
    ...overrides,
  };
}

function sessionCookie(response: request.Response): string {
  const value = response.headers["set-cookie"]?.[0];
  if (!value) throw new Error("Expected an authentication cookie.");
  return value.split(";")[0];
}
