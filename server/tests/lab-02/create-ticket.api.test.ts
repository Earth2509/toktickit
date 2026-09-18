import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requesterFindFirst = vi.fn();
const categoryFindFirst = vi.fn();
const relatedSystemFindFirst = vi.fn();
const ticketFindUnique = vi.fn();
const ticketCreate = vi.fn();
const ticketUpdate = vi.fn();
const transaction = vi.fn();
const sessionFindUnique = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    user: { findFirst: requesterFindFirst },
    category: { findFirst: categoryFindFirst },
    relatedSystem: { findFirst: relatedSystemFindFirst },
    ticket: { findUnique: ticketFindUnique },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const requestBody = {
  categoryId: 2,
  relatedSystemId: 3,
  summary: "  Cannot connect to the campus network  ",
  description: "  The wireless connection drops every few minutes.  ",
  requestedPriority: "HIGH",
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
};

const token = "create-ticket-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const csrfSecret = "create-ticket-test-secret";
const csrf = createHmac("sha256", csrfSecret).update(tokenHash).digest("base64url");
const user = {
  id: 1,
  displayName: "Authenticated Requester",
  email: "requester@example.test",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
  credentialVersion: 1,
};

function postTicket() {
  return request(app)
    .post("/api/tickets")
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf);
}

const createdTicket = {
  id: 42,
  ticketNumber: "TT-2026-000042",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 3,
  summary: "Cannot connect to the campus network",
  description: "The wireless connection drops every few minutes.",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  idempotencyKey: requestBody.idempotencyKey,
  createdAt: new Date("2026-08-28T12:00:00.000Z"),
  updatedAt: new Date("2026-08-28T12:00:00.000Z"),
  category: { id: 2, name: "Network" },
  relatedSystem: { id: 3, name: "Campus Wi-Fi" },
};

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = csrfSecret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({
      tokenHash,
      userId: user.id,
      credentialVersion: user.credentialVersion,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    ticketFindUnique.mockResolvedValue(null);
    requesterFindFirst.mockResolvedValue({ id: 1 });
    categoryFindFirst.mockResolvedValue({ id: 2 });
    relatedSystemFindFirst.mockResolvedValue({ id: 3 });
    ticketCreate.mockResolvedValue({ id: 42, createdAt: createdTicket.createdAt });
    ticketUpdate.mockResolvedValue(createdTicket);
    transaction.mockImplementation((callback: (client: { ticket: { create: typeof ticketCreate; update: typeof ticketUpdate } }) => unknown) =>
      callback({ ticket: { create: ticketCreate, update: ticketUpdate } }),
    );
  });

  it("creates exactly one NEW Ticket with a server-generated number", async () => {
    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      currentStatus: "NEW",
      summary: "Cannot connect to the campus network",
      description: "The wireless connection drops every few minutes.",
    });
    expect(response.body.ticketNumber).toMatch(/^TT-\d{4}-\d{6}$/);
    expect(response.body.ticketNumber).not.toMatch(/^PENDING-/);
    expect(ticketCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requesterId: 1,
        categoryId: 2,
        relatedSystemId: 3,
        requestedPriority: "HIGH",
        currentStatus: "NEW",
        ticketNumber: expect.stringMatching(/^PENDING-/),
      }),
      select: { id: true, createdAt: true },
    });
    expect(ticketUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 42 },
      data: { ticketNumber: "TT-2026-000042" },
    }));
  });

  it("rejects malformed Ticket fields before any database write", async () => {
    const response = await postTicket().send({ ...requestBody, summary: "bad" });

    expect(response.status).toBe(422);
    expect(response.body.fieldErrors.summary).toBe("Enter 5-120 characters.");
    expect(ticketFindUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns a safe 400 response for a malformed request body", async () => {
    const response = await postTicket().send([]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "A JSON object is required." });
    expect(ticketFindUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns safe JSON for a body rejected by the JSON parser", async () => {
    const response = await postTicket()
      .send({ ...requestBody, description: "x".repeat(103_000) });

    expect(response.status).toBe(413);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toEqual({ message: "Request payload is too large." });
  });

  it("returns the original Ticket when the same idempotency key and payload are retried", async () => {
    ticketFindUnique.mockResolvedValue(createdTicket);

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body.ticketNumber).toBe("TT-2026-000042");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects reuse of an idempotency key with different Ticket data", async () => {
    ticketFindUnique.mockResolvedValue(createdTicket);

    const response = await postTicket().send({ ...requestBody, summary: "A different network incident" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "The idempotency key was already used with different Ticket data." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns the winning Ticket when a concurrent create loses the idempotency race", async () => {
    ticketFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createdTicket);
    transaction.mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: "P2002" }));

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(200);
    expect(response.body.ticketNumber).toBe("TT-2026-000042");
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("returns a conflict when a concurrent winning Ticket has different data", async () => {
    ticketFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...createdTicket, summary: "A different network incident" });
    transaction.mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: "P2002" }));

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "The idempotency key was already used with different Ticket data." });
  });

  it("fails safely when a requester or reference record is inactive or unavailable", async () => {
    requesterFindFirst.mockResolvedValue(null);

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Requester or reference data is unavailable." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns 500 for an unexpected persistence failure", async () => {
    transaction.mockRejectedValueOnce(new Error("unexpected failure"));

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ code: "INTERNAL_ERROR", message: "Unable to complete the request" });
  });

  it("returns 503 for an unavailable database dependency", async () => {
    transaction.mockRejectedValueOnce(Object.assign(new Error("database unavailable"), { code: "P1001" }));

    const response = await postTicket().send(requestBody);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Ticket service is temporarily unavailable." });
  });
});
