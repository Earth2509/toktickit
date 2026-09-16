import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketFindUnique = vi.fn();
const ticketFindUniqueOrThrow = vi.fn();
const ticketUpdateMany = vi.fn();
const ticketEventCreate = vi.fn();
const transaction = vi.fn();
const userFindFirst = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: {},
    user: { findFirst: userFindFirst },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "workflow-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const secret = "workflow-test-secret";
const csrf = createHmac("sha256", secret).update(tokenHash).digest("base64url");
const staff = { id: 71, displayName: "Workflow Staff", email: "staff@example.test", role: "IT_STAFF", isActive: true, mustChangePassword: false, credentialVersion: 1 };

function mutate(path: string, body: object) {
  return request(app).post(path).set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send(body);
}

describe("Lab 3 workflow mutation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = secret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({ tokenHash, userId: staff.id, credentialVersion: staff.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user: staff });
    ticketFindUnique.mockResolvedValue({ id: 9, version: 4, ownerId: null, currentStatus: "NEW", itPriority: "MEDIUM" });
    ticketUpdateMany.mockResolvedValue({ count: 1 });
    ticketFindUniqueOrThrow.mockResolvedValue({ id: 9, ticketNumber: "TT-2026-000009", ownerId: staff.id, itPriority: "MEDIUM", currentStatus: "NEW", version: 5, resolutionSummary: null, updatedAt: new Date() });
    ticketEventCreate.mockResolvedValue({ id: 1 });
    userFindFirst.mockResolvedValue({ id: staff.id });
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({ ticket: { findUnique: ticketFindUnique, updateMany: ticketUpdateMany, findUniqueOrThrow: ticketFindUniqueOrThrow }, ticketEvent: { create: ticketEventCreate }, user: { findFirst: userFindFirst } }));
  });

  it("claims an eligible Ticket using a conditional version write and records an event", async () => {
    const response = await mutate("/api/staff/tickets/9/claim", { version: 4 });
    expect(response.status).toBe(200);
    expect(ticketUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 9, version: 4 }, data: expect.objectContaining({ ownerId: staff.id }) }));
    expect(ticketEventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ticketId: 9, actorId: staff.id, type: "CLAIM" }) }));
  });

  it("returns a conflict when a concurrent write has already changed the version", async () => {
    ticketUpdateMany.mockResolvedValue({ count: 0 });
    const response = await mutate("/api/staff/tickets/9/claim", { version: 4 });
    expect(response.status).toBe(409);
    expect(ticketEventCreate).not.toHaveBeenCalled();
  });

  it("rejects a status transition that requires an owner before mutating", async () => {
    const response = await request(app).patch("/api/staff/tickets/9/status").set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send({ version: 4, currentStatus: "OPEN" });
    expect(response.status).toBe(409);
    expect(ticketUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 422 for malformed transition evidence instead of a reload conflict", async () => {
    ticketFindUnique.mockResolvedValue({ id: 9, version: 4, ownerId: staff.id, currentStatus: "OPEN", itPriority: "MEDIUM" });
    const response = await request(app).patch("/api/staff/tickets/9/status").set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send({ version: 4, currentStatus: "CANCELLED", reason: "No" });
    expect(response.status).toBe(422);
    expect(ticketUpdateMany).not.toHaveBeenCalled();
  });

  it("clears an inactive historical owner atomically when reopening a terminal Ticket", async () => {
    ticketFindUnique.mockResolvedValue({ id: 9, version: 4, ownerId: 44, currentStatus: "RESOLVED", itPriority: "MEDIUM" });
    ticketFindUniqueOrThrow.mockResolvedValue({ id: 9, ticketNumber: "TT-2026-000009", ownerId: null, itPriority: "MEDIUM", currentStatus: "REOPENED", version: 5, resolutionSummary: "Resolved earlier", updatedAt: new Date() });
    userFindFirst.mockResolvedValue(null);
    const response = await request(app).patch("/api/staff/tickets/9/status").set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send({ version: 4, currentStatus: "REOPENED", reason: "The incident returned." });
    expect(response.status).toBe(200);
    expect(userFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 44, isActive: true }) }));
    expect(ticketUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ currentStatus: "REOPENED", ownerId: null }) }));
    expect(ticketEventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "STATUS_CHANGED" }) }));
  });
});
