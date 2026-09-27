import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketLock = vi.fn();
const ticketFindUnique = vi.fn();
const ticketUpdateMany = vi.fn();
const ticketFindUniqueOrThrow = vi.fn();
const actionCount = vi.fn();
const actionFindFirst = vi.fn();
const eventFindFirst = vi.fn();
const eventCreate = vi.fn();
const userFindFirst = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    user: { findFirst: userFindFirst },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "lab4-workflow-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const secret = "lab4-workflow-secret";
const csrf = createHmac("sha256", secret).update(tokenHash).digest("base64url");
const staff = { id: 71, displayName: "Workflow Staff", email: "staff@example.test", role: "IT_STAFF", isActive: true, mustChangePassword: false, credentialVersion: 1 };
const requester = { ...staff, id: 72, role: "REQUESTER" };
const completedAt = new Date("2026-09-27T09:00:00.000Z");

function patch(path: string, body: object) {
  return request(app).patch(path)
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf)
    .send(body);
}

function resolve(summary = "Service restored and verified.") {
  return patch("/api/staff/tickets/9/status", { version: 4, currentStatus: "RESOLVED", resolutionSummary: summary });
}

describe("Lab 4 Ticket workflow API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = secret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({ tokenHash, userId: staff.id, credentialVersion: 1, expiresAt: new Date(Date.now() + 60_000), user: staff });
    ticketLock.mockResolvedValue([{ id: 9, currentStatus: "OPEN" }]);
    ticketFindUnique.mockResolvedValue({ id: 9, version: 4, ownerId: staff.id, currentStatus: "OPEN", itPriority: "MEDIUM" });
    ticketUpdateMany.mockResolvedValue({ count: 1 });
    ticketFindUniqueOrThrow.mockResolvedValue({ id: 9, ticketNumber: "TT-2026-000009", ownerId: staff.id, currentStatus: "RESOLVED", itPriority: "MEDIUM", version: 5, resolutionSummary: "Service restored and verified.", updatedAt: new Date() });
    actionCount.mockResolvedValue(0);
    actionFindFirst.mockResolvedValue({ completedAt, followUpRequired: false });
    eventFindFirst.mockResolvedValue(null);
    eventCreate.mockResolvedValue({ id: 1 });
    userFindFirst.mockResolvedValue({ id: staff.id });
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({
      $queryRaw: ticketLock,
      ticket: { findUnique: ticketFindUnique, updateMany: ticketUpdateMany, findUniqueOrThrow: ticketFindUniqueOrThrow },
      actionTaken: { count: actionCount, findFirst: actionFindFirst },
      ticketEvent: { findFirst: eventFindFirst, create: eventCreate },
      user: { findFirst: userFindFirst },
    }));
  });

  it("resolves after locking the Ticket, checking the latest Action, and recording an audit event", async () => {
    const response = await resolve();
    expect(response.status).toBe(200);
    expect(ticketLock).toHaveBeenCalledTimes(1);
    expect(ticketLock.mock.invocationCallOrder[0]).toBeLessThan(actionCount.mock.invocationCallOrder[0]);
    expect(actionCount).toHaveBeenCalledWith({ where: { ticketId: 9, status: "OPEN" } });
    expect(actionFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ticketId: 9, status: "COMPLETED" }, orderBy: [{ completedAt: "desc" }, { id: "desc" }] }));
    expect(eventFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ticketId: 9, type: "STATUS_CHANGED", after: { path: ["currentStatus"], equals: "REOPENED" } } }));
    expect(ticketUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 9, version: 4 }, data: expect.objectContaining({ currentStatus: "RESOLVED", resolutionSummary: "Service restored and verified.", version: { increment: 1 } }) }));
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "STATUS_CHANGED", actorId: staff.id, ticketId: 9 }) }));
  });

  it("rejects an invalid summary with 422 before reading Action evidence", async () => {
    const response = await resolve("No");
    expect(response.status).toBe(422);
    expect(actionCount).not.toHaveBeenCalled();
    expect(ticketUpdateMany).not.toHaveBeenCalled();
  });

  it("requires an active owner and no open Action without mutating", async () => {
    userFindFirst.mockResolvedValueOnce(null);
    expect((await resolve()).status).toBe(409);
    actionCount.mockResolvedValueOnce(1);
    const openAction = await resolve();
    expect(openAction.status).toBe(409);
    expect(openAction.body.message).toMatch(/open Action/i);
    expect(ticketUpdateMany).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("requires a completed Action whose latest follow-up is cleared", async () => {
    actionFindFirst.mockResolvedValueOnce(null);
    expect((await resolve()).body.message).toMatch(/completed Action/i);
    actionFindFirst.mockResolvedValueOnce({ completedAt, followUpRequired: true });
    expect((await resolve()).body.message).toMatch(/no follow-up required/i);
    expect(ticketUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects pre-reopen work and accepts a new completion after the latest reopen", async () => {
    eventFindFirst.mockResolvedValue({ createdAt: new Date("2026-09-27T10:00:00.000Z") });
    const rejected = await resolve();
    expect(rejected.status).toBe(409);
    expect(rejected.body.message).toMatch(/after the latest reopening/i);
    actionFindFirst.mockResolvedValue({ completedAt: new Date("2026-09-27T11:00:00.000Z"), followUpRequired: false });
    expect((await resolve()).status).toBe(200);
    expect(eventCreate).toHaveBeenCalledTimes(1);
  });

  it("preserves the version conflict and never records an event for a rejected write", async () => {
    ticketFindUnique.mockResolvedValueOnce({ id: 9, version: 5, ownerId: staff.id, currentStatus: "OPEN", itPriority: "MEDIUM" });
    expect((await resolve()).status).toBe(409);
    ticketUpdateMany.mockResolvedValueOnce({ count: 0 });
    expect((await resolve()).status).toBe(409);
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("keeps claim and owner reassignment within the authenticated Staff workflow", async () => {
    ticketFindUnique.mockResolvedValueOnce({ id: 9, version: 4, ownerId: null, currentStatus: "NEW", itPriority: "MEDIUM" });
    const claim = await request(app).post("/api/staff/tickets/9/claim")
      .set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send({ version: 4 });
    expect(claim.status).toBe(200);
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "CLAIM" }) }));
    const reassigned = await patch("/api/staff/tickets/9/owner", { version: 4, ownerId: 73 });
    expect(reassigned.status).toBe(200);
    expect(userFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 73, isActive: true }) }));
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "OWNER_CHANGED" }) }));
  });

  it("keeps CLOSED dependent on RESOLVED and blocks a Requester before lookup", async () => {
    expect((await patch("/api/staff/tickets/9/status", { version: 4, currentStatus: "CLOSED" })).status).toBe(409);
    ticketFindUnique.mockResolvedValueOnce({ id: 9, version: 4, ownerId: staff.id, currentStatus: "RESOLVED", itPriority: "MEDIUM" });
    expect((await patch("/api/staff/tickets/9/status", { version: 4, currentStatus: "CLOSED" })).status).toBe(200);
    sessionFindUnique.mockResolvedValueOnce({ tokenHash, userId: requester.id, credentialVersion: 1, expiresAt: new Date(Date.now() + 60_000), user: requester });
    const before = transaction.mock.calls.length;
    expect((await resolve()).status).toBe(403);
    expect(transaction).toHaveBeenCalledTimes(before);
  });
});
