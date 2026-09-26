import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketFindUnique = vi.fn();
const ticketFindFirst = vi.fn();
const actionCreate = vi.fn();
const actionCount = vi.fn();
const actionFindMany = vi.fn();
const actionFindFirst = vi.fn();
const actionFindUniqueOrThrow = vi.fn();
const actionUpdateMany = vi.fn();
const idempotencyFindUnique = vi.fn();
const idempotencyCreate = vi.fn();
const ticketEventCreate = vi.fn();
const userFindFirst = vi.fn();
const ticketLock = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: { findUnique: ticketFindUnique, findFirst: ticketFindFirst },
    actionTaken: { count: actionCount, findMany: actionFindMany },
    actionTakenIdempotency: { findUnique: idempotencyFindUnique },
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

function patch(body: object) {
  return request(app)
    .patch("/api/staff/tickets/9/actions-taken/31")
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf)
    .send(body);
}

function requesterSession() {
  const requester = { id: 16, displayName: "Owned Requester", email: "requester@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false, credentialVersion: 1 };
  sessionFindUnique.mockResolvedValue({ tokenHash, userId: requester.id, credentialVersion: requester.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user: requester });
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
    actionFindFirst.mockResolvedValue(action);
    actionFindUniqueOrThrow.mockResolvedValue({ ...action, version: 2 });
    actionUpdateMany.mockResolvedValue({ count: 1 });
    actionCount.mockResolvedValue(1);
    actionFindMany.mockResolvedValue([action]);
    ticketEventCreate.mockResolvedValue({ id: 1 });
    idempotencyCreate.mockResolvedValue({ id: 1 });
    ticketLock.mockResolvedValue([{ id: 9, currentStatus: "OPEN" }]);
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({
      $queryRaw: ticketLock,
      ticket: { findUnique: ticketFindUnique },
      user: { findFirst: userFindFirst },
      actionTaken: { create: actionCreate, findFirst: actionFindFirst, findUniqueOrThrow: actionFindUniqueOrThrow, updateMany: actionUpdateMany },
      actionTakenIdempotency: { findUnique: idempotencyFindUnique, create: idempotencyCreate, delete: vi.fn() },
      ticketEvent: { create: ticketEventCreate },
    }));
  });

  it("creates an Action with a session-derived performer and audit event", async () => {
    const response = await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", assignedToId: 72, followUpRequired: false });
    expect(response.status).toBe(201);
    expect(actionCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ticketId: 9, performedById: staff.id, status: "OPEN", result: null }) }));
    expect(ticketEventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "ACTION_TAKEN_CREATED", actorId: staff.id }) }));
    expect(ticketLock).toHaveBeenCalledTimes(1);
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

  it("uses requester ownership in the Action list query", async () => {
    requesterSession();
    ticketFindFirst.mockResolvedValue({ id: 9 });
    const response = await request(app)
      .get("/api/tickets/9/actions-taken?page=1&pageSize=10")
      .set("Cookie", `toktickit_session=${token}`);

    expect(response.status).toBe(200);
    expect(ticketFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 9, requesterId: 16 } }));
  });

  it("blocks a requester from the Staff Action write endpoint before any lookup", async () => {
    requesterSession();
    const response = await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Forged staff work", assignedToId: 72, followUpRequired: false });
    expect(response.status).toBe(403);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a create on a terminal Ticket and an inactive assignee before writing", async () => {
    ticketLock.mockResolvedValueOnce([{ id: 9, currentStatus: "CLOSED" }]);
    expect((await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated", assignedToId: 72, followUpRequired: false })).status).toBe(409);
    ticketLock.mockResolvedValueOnce([{ id: 9, currentStatus: "OPEN" }]);
    userFindFirst.mockResolvedValueOnce(null);
    expect((await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated", assignedToId: 72, followUpRequired: false }, "inactive-assignee")).status).toBe(422);
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it("re-reads a committed request after an idempotency unique-key race", async () => {
    const fingerprint = createHash("sha256").update(JSON.stringify({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", result: null, assignedToId: 72, status: "OPEN", followUpRequired: false, followUpNote: null, attachmentNotes: null })).digest("base64url");
    transaction.mockRejectedValueOnce({ code: "P2002" });
    idempotencyFindUnique.mockResolvedValueOnce({ expiresAt: new Date(Date.now() + 60_000), fingerprint, actionTaken: action });
    const response = await create({ actionAt: "2026-09-25T08:00:00.000Z", description: "Investigated the reported fault.", assignedToId: 72, followUpRequired: false }, "concurrent-key");
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(action.id);
  });

  it("enforces Action version, permissions and terminal state before an update", async () => {
    expect((await patch({ version: 2, description: "A stale write" })).status).toBe(409);
    actionFindFirst.mockResolvedValueOnce({ ...action, performedBy: { ...action.performedBy, id: 70 }, assignedTo: { ...action.assignedTo, id: 72 } });
    expect((await patch({ version: 1, description: "A stranger write" })).status).toBe(403);
    actionFindFirst.mockResolvedValueOnce({ ...action, status: "COMPLETED", result: "Done", completedAt: new Date() });
    expect((await patch({ version: 1, description: "A terminal write" })).status).toBe(409);
    expect(actionUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a PATCH when the Ticket became terminal and writes with the current Action version", async () => {
    ticketLock.mockResolvedValueOnce([{ id: 9, currentStatus: "RESOLVED" }]);
    expect((await patch({ version: 1, description: "No work after resolution" })).status).toBe(409);
    ticketLock.mockResolvedValueOnce([{ id: 9, currentStatus: "OPEN" }]);
    expect((await patch({ version: 1, description: "Clarified the investigation" })).status).toBe(200);
    expect(actionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 31, ticketId: 9, version: 1 } }));
  });
});
