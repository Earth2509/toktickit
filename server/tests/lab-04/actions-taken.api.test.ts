import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketFindUnique = vi.fn();
const ticketFindFirst = vi.fn();
const actionCreate = vi.fn();
const actionCount = vi.fn();
const actionFindMany = vi.fn();
const idempotencyFindUnique = vi.fn();
const idempotencyCreate = vi.fn();
const ticketEventCreate = vi.fn();
const userFindFirst = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: { findUnique: ticketFindUnique, findFirst: ticketFindFirst },
    actionTaken: { count: actionCount, findMany: actionFindMany },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "lab4-action-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const secret = "lab4-action-secret";
const csrf = createHmac("sha256", secret).update(tokenHash).digest("base64url");
const staff = { id: 71, displayName: "Action Staff", email: "staff@example.test", role: "IT_STAFF", isActive: true, mustChangePassword: false, credentialVersion: 1 };
const action = {
  id: 31, ticketId: 9, actionAt: new Date("2026-09-25T08:00:00.000Z"), completedAt: null,
  description: "Investigated the reported fault.", result: null, status: "OPEN", followUpRequired: false,
  followUpNote: null, attachmentNotes: null, version: 1, createdAt: new Date(), updatedAt: new Date(),
  performedBy: { id: 71, displayName: "Action Staff", role: "IT_STAFF" },
  assignedTo: { id: 72, displayName: "Assigned Staff", role: "IT_STAFF" },
};

function create(body: object, key = "action-request-1") {
  return request(app)
    .post("/api/staff/tickets/9/actions-taken")
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf)
    .set("Idempotency-Key", key)
    .send(body);
}

describe("Lab 4 Action Taken API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = secret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({ tokenHash, userId: staff.id, credentialVersion: staff.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user: staff });
    ticketFindUnique.mockResolvedValue({ id: 9 });
    userFindFirst.mockResolvedValue({ id: 72 });
    idempotencyFindUnique.mockResolvedValue(null);
    actionCreate.mockResolvedValue(action);
    ticketEventCreate.mockResolvedValue({ id: 1 });
    idempotencyCreate.mockResolvedValue({ id: 1 });
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({
      ticket: { findUnique: ticketFindUnique },
      user: { findFirst: userFindFirst },
      actionTaken: { create: actionCreate },
      actionTakenIdempotency: { findUnique: idempotencyFindUnique, create: idempotencyCreate, delete: vi.fn() },
      ticketEvent: { create: ticketEventCreate },
    }));
  });

  it("creates an Action with a session-derived performer and audit event", async () => {
    const response = await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", assignedToId: 72, followUpRequired: false });
    expect(response.status).toBe(201);
    expect(actionCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ticketId: 9, performedById: staff.id, status: "OPEN", result: null }) }));
    expect(ticketEventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "ACTION_TAKEN_CREATED", actorId: staff.id }) }));
  });

  it("returns the stored result for an idempotent replay and does not create another Action", async () => {
    const fingerprint = createHash("sha256").update(JSON.stringify({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", result: null, assignedToId: 72, status: "OPEN", followUpRequired: false, followUpNote: null, attachmentNotes: null })).digest("base64url");
    idempotencyFindUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 60_000), fingerprint, actionTaken: action });
    const response = await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", assignedToId: 72, followUpRequired: false });
    expect(response.status).toBe(200);
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("rejects a forged performer field and invalid required follow-up evidence before writing", async () => {
    expect((await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated", assignedToId: 72, followUpRequired: false, performedById: 99 })).status).toBe(400);
    expect((await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated", assignedToId: 72, followUpRequired: true })).status).toBe(422);
    expect(actionCreate).not.toHaveBeenCalled();
  });
});
