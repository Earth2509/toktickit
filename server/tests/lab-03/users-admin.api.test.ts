import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const userFindMany = vi.fn();
const userCreate = vi.fn();
const userFindFirst = vi.fn();
const userFindUnique = vi.fn();
const userUpdateMany = vi.fn();
const userCount = vi.fn();
const sessionDeleteMany = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    user: { findMany: userFindMany, create: userCreate },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "admin-user-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const secret = "admin-user-test-secret";
const csrf = createHmac("sha256", secret).update(tokenHash).digest("base64url");
const admin = { id: 1, displayName: "Admin", email: "admin@example.test", role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, credentialVersion: 1 };
const safeUser = { ...admin, version: 1, createdAt: new Date(), updatedAt: new Date() };

function mutatingRequest(path: string) {
  return request(app).post(path).set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf);
}

describe("Lab 3 Administrator user API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = secret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({ tokenHash, userId: admin.id, credentialVersion: 1, expiresAt: new Date(Date.now() + 60_000), user: admin });
    userFindMany.mockResolvedValue([safeUser]);
    userCreate.mockResolvedValue(safeUser);
    userFindFirst.mockResolvedValue({ id: admin.id });
    userFindUnique.mockResolvedValue(safeUser);
    userUpdateMany.mockResolvedValue({ count: 1 });
    userCount.mockResolvedValue(2);
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({
      $executeRawUnsafe: vi.fn(),
      user: { findFirst: userFindFirst, findUnique: userFindUnique, updateMany: userUpdateMany, count: userCount },
      session: { deleteMany: sessionDeleteMany },
      ticket: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn() },
      ticketEvent: { create: vi.fn() },
    }));
  });

  it("denies non-Administrators before a user list lookup", async () => {
    sessionFindUnique.mockResolvedValue({ tokenHash, userId: 2, credentialVersion: 1, expiresAt: new Date(Date.now() + 60_000), user: { ...admin, id: 2, role: "IT_STAFF" } });
    const response = await request(app).get("/api/admin/users").set("Cookie", `toktickit_session=${token}`);
    expect(response.status).toBe(403);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("lists a safe, role-filtered user directory", async () => {
    const response = await request(app).get("/api/admin/users?search=admin&role=ADMINISTRATOR").set("Cookie", `toktickit_session=${token}`);
    expect(response.status).toBe(200);
    expect(response.body.items[0]).not.toHaveProperty("passwordHash");
    expect(userFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ role: "ADMINISTRATOR" }) }));
  });

  it("validates user creation and never returns the supplied password", async () => {
    const invalid = await mutatingRequest("/api/admin/users").send({ displayName: "New User", email: "new@example.test", role: "REQUESTER", isActive: true, initialPassword: "short" });
    expect(invalid.status).toBe(422);
    const response = await mutatingRequest("/api/admin/users").send({ displayName: "New User", email: "new@example.test", role: "REQUESTER", isActive: true, initialPassword: "A valid initial password" });
    expect(response.status).toBe(201);
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.text).not.toContain("A valid initial password");
  });

  it("resets an initial password by revoking sessions and requiring a change", async () => {
    const response = await mutatingRequest("/api/admin/users/9/initial-password").send({ initialPassword: "A valid initial password", version: 3 });
    expect(response.status).toBe(200);
    expect(userUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mustChangePassword: true, credentialVersion: { increment: 1 } }) }));
    expect(sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: 9 } });
  });

  it("rejects deactivating the final active Administrator", async () => {
    userFindUnique.mockResolvedValueOnce({ id: 9, role: "ADMINISTRATOR", isActive: true, version: 3 });
    userCount.mockResolvedValue(1);
    const response = await request(app).patch("/api/admin/users/9").set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send({ displayName: "Only Admin", email: "only@example.test", role: "ADMINISTRATOR", isActive: false, version: 3 });
    expect(response.status).toBe(409);
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});
