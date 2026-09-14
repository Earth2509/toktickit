import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const categoryFindMany = vi.fn();
const userFindFirst = vi.fn();
const categoryFindFirst = vi.fn();
const relatedSystemFindFirst = vi.fn();
const ticketCount = vi.fn();
const ticketFindMany = vi.fn();
const ticketFindFirst = vi.fn();
const ticketFindUnique = vi.fn();
const ticketCreate = vi.fn();
const ticketUpdate = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique, deleteMany: vi.fn() },
    user: { findFirst: userFindFirst },
    category: { findMany: categoryFindMany, findFirst: categoryFindFirst },
    relatedSystem: { findFirst: relatedSystemFindFirst },
    ticket: { count: ticketCount, findMany: ticketFindMany, findFirst: ticketFindFirst, findUnique: ticketFindUnique },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "authenticated-requester-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const csrfSecret = "authorization-api-test-secret";
const csrf = createHmac("sha256", csrfSecret).update(tokenHash).digest("base64url");

const requester = { id: 41, displayName: "Authenticated Requester", email: "requester@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false, credentialVersion: 3 };

function sessionFor(user = requester) {
  return { tokenHash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user };
}

function authenticated(path: string) {
  return request(app).get(path).set("Cookie", `toktickit_session=${token}`);
}

describe("Lab 3 resource authorization and requester identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = csrfSecret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue(sessionFor());
    categoryFindMany.mockResolvedValue([{ id: 1, name: "Hardware" }]);
    ticketCount.mockResolvedValue(0);
    ticketFindMany.mockResolvedValue([]);
    ticketFindUnique.mockResolvedValue(null);
    userFindFirst.mockResolvedValue({ id: requester.id });
    categoryFindFirst.mockResolvedValue({ id: 2 });
    relatedSystemFindFirst.mockResolvedValue({ id: 3 });
    ticketCreate.mockResolvedValue({ id: 42, createdAt: new Date("2026-09-13T00:00:00.000Z") });
    ticketUpdate.mockResolvedValue({ id: 42, ticketNumber: "TT-2026-000042", requesterId: requester.id, currentStatus: "NEW" });
    transaction.mockImplementation((callback: (client: { ticket: { create: typeof ticketCreate; update: typeof ticketUpdate } }) => unknown) => callback({ ticket: { create: ticketCreate, update: ticketUpdate } }));
  });

  it("requires an authenticated, password-complete session for private references", async () => {
    expect((await request(app).get("/api/categories")).status).toBe(401);

    sessionFindUnique.mockResolvedValueOnce(sessionFor({ ...requester, mustChangePassword: true }));
    const pending = await authenticated("/api/categories");
    expect(pending.status).toBe(403);
    expect(pending.body.code).toBe("PASSWORD_CHANGE_REQUIRED");

    const allowed = await authenticated("/api/categories");
    expect(allowed.status).toBe(200);
    expect(allowed.body).toEqual([{ id: 1, name: "Hardware" }]);
  });

  it("removes the development requester directory", async () => {
    expect((await authenticated("/api/requesters")).status).toBe(404);
  });

  it("derives list ownership from the authenticated user and rejects legacy identity", async () => {
    const response = await authenticated("/api/tickets");
    expect(response.status).toBe(200);
    expect(ticketCount).toHaveBeenCalledWith({ where: expect.objectContaining({ requesterId: requester.id }) });

    const legacy = await authenticated("/api/tickets?requesterId=999");
    expect(legacy.status).toBe(400);
    expect(legacy.body.code).toBe("LEGACY_IDENTITY_UNSUPPORTED");
  });

  it("rejects forged requester identity on creation before persistence", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("Cookie", `toktickit_session=${token}`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send({ requesterId: 999 });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("LEGACY_IDENTITY_UNSUPPORTED");
  });

  it("creates a Ticket for the authenticated Requester without accepting client identity", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .set("Cookie", `toktickit_session=${token}`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send({
        categoryId: 2,
        relatedSystemId: 3,
        summary: "Authenticated ownership",
        description: "The server must derive ownership from the active authenticated session.",
        requestedPriority: "HIGH",
        idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
      });
    expect(response.status).toBe(201);
    expect(ticketCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ requesterId: requester.id, currentStatus: "NEW" }),
    }));
  });

  it("requires both a trusted Origin and the session-bound CSRF token for mutations", async () => {
    const noOrigin = await request(app).post("/api/tickets").set("Cookie", `toktickit_session=${token}`).send({});
    expect(noOrigin.status).toBe(403);

    const noCsrf = await request(app)
      .post("/api/tickets")
      .set("Cookie", `toktickit_session=${token}`)
      .set("Origin", "http://localhost:5173")
      .send({});
    expect(noCsrf.status).toBe(403);
    expect(ticketCreate).not.toHaveBeenCalled();
  });

  it("returns the same not-found response for a missing or cross-owner Ticket", async () => {
    ticketFindFirst.mockResolvedValue(null);
    const missing = await authenticated("/api/tickets/999");
    const crossOwner = await authenticated("/api/tickets/7");
    expect(missing.status).toBe(404);
    expect(crossOwner.status).toBe(404);
    expect(crossOwner.body).toEqual(missing.body);
    expect(ticketFindFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: 7, requesterId: requester.id } }));
  });

  it("denies requester-list operations to Staff while permitting direct shared reads", async () => {
    const staff = { ...requester, id: 77, role: "IT_STAFF" };
    sessionFindUnique.mockResolvedValue(sessionFor(staff));
    expect((await authenticated("/api/tickets")).status).toBe(403);

    ticketFindFirst.mockResolvedValue({ id: 7, requesterId: 41, requester: {}, category: {}, relatedSystem: {}, attachments: [] });
    const detail = await authenticated("/api/tickets/7");
    expect(detail.status).toBe(200);
    expect(ticketFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 } }));
  });

  it("denies Requester-only Ticket creation to Staff", async () => {
    sessionFindUnique.mockResolvedValue(sessionFor({ ...requester, id: 77, role: "IT_STAFF" }));
    const response = await request(app)
      .post("/api/tickets")
      .set("Cookie", `toktickit_session=${token}`)
      .set("Origin", "http://localhost:5173")
      .set("X-CSRF-Token", csrf)
      .send({});
    expect(response.status).toBe(403);
    expect(ticketCreate).not.toHaveBeenCalled();
  });
});
