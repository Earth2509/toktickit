import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketFindFirst = vi.fn();
const ticketFindUnique = vi.fn();
const publicCommentCount = vi.fn();
const publicCommentFindMany = vi.fn();
const publicCommentCreate = vi.fn();
const internalNoteCount = vi.fn();
const internalNoteFindMany = vi.fn();
const internalNoteCreate = vi.fn();
const ticketUpdateMany = vi.fn();
const ticketEventCreate = vi.fn();
const transaction = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: { findFirst: ticketFindFirst, findUnique: ticketFindUnique },
    publicComment: { count: publicCommentCount, findMany: publicCommentFindMany, create: publicCommentCreate },
    internalNote: { count: internalNoteCount, findMany: internalNoteFindMany, create: internalNoteCreate },
    $transaction: transaction,
  }),
}));

import { app } from "../../src/app.js";

const token = "discussion-api-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const secret = "discussion-api-secret";
const csrf = createHmac("sha256", secret).update(tokenHash).digest("base64url");
const requester = { id: 41, displayName: "Requester A", email: "requester@example.test", role: "REQUESTER" as const, isActive: true, mustChangePassword: false, credentialVersion: 1 };
const staff = { id: 71, displayName: "Staff A", email: "staff@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false, credentialVersion: 1 };

function sessionFor(user: typeof requester | typeof staff) {
  return { tokenHash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user };
}

function read(path: string) {
  return request(app).get(path).set("Cookie", `toktickit_session=${token}`);
}

function post(path: string, body: object) {
  return request(app).post(path).set("Cookie", `toktickit_session=${token}`).set("Origin", "http://localhost:5173").set("X-CSRF-Token", csrf).send(body);
}

describe("Lab 3 comments, internal notes and resolution indication API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = secret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue(sessionFor(requester));
    ticketFindFirst.mockResolvedValue({ id: 9, version: 4, requesterId: requester.id, currentStatus: "OPEN", requesterResolvedAt: null, requesterResolvedById: null });
    ticketFindUnique.mockResolvedValue({ id: 9, currentStatus: "OPEN" });
    publicCommentCount.mockResolvedValue(1);
    publicCommentFindMany.mockResolvedValue([{ id: 3, content: "Visible update", author: { id: staff.id, displayName: staff.displayName, role: staff.role } }]);
    publicCommentCreate.mockResolvedValue({ id: 4, content: "Requester reply", author: { id: requester.id, displayName: requester.displayName, role: requester.role } });
    internalNoteCount.mockResolvedValue(1);
    internalNoteFindMany.mockResolvedValue([{ id: 8, content: "LEAKED=false", author: { id: staff.id, displayName: staff.displayName, role: staff.role } }]);
    internalNoteCreate.mockResolvedValue({ id: 9, content: "Private triage", author: { id: staff.id, displayName: staff.displayName, role: staff.role } });
    ticketUpdateMany.mockResolvedValue({ count: 1 });
    ticketEventCreate.mockResolvedValue({ id: 1 });
    transaction.mockImplementation((callback: (client: unknown) => unknown) => callback({
      ticket: { findFirst: ticketFindFirst, updateMany: ticketUpdateMany },
      ticketEvent: { create: ticketEventCreate },
    }));
  });

  it("keeps internal notes unavailable to a Requester before querying either the ticket or notes", async () => {
    const response = await read("/api/tickets/9/internal-notes");
    expect(response.status).toBe(403);
    expect(ticketFindUnique).not.toHaveBeenCalled();
    expect(internalNoteFindMany).not.toHaveBeenCalled();
  });

  it("returns only public comments to the owning Requester with stable newest-first pagination", async () => {
    const response = await read("/api/tickets/9/comments?page=2&pageSize=20");
    expect(response.status).toBe(200);
    expect(response.body.items[0].content).toBe("Visible update");
    expect(publicCommentFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }));
    expect(internalNoteFindMany).not.toHaveBeenCalled();
  });

  it("rejects unknown pagination parameters instead of silently using defaults", async () => {
    const response = await read("/api/tickets/9/comments?pageSiz=50");
    expect(response.status).toBe(400);
    expect(publicCommentFindMany).not.toHaveBeenCalled();
  });

  it("derives comment authorship on the server and rejects spoofed, blank and oversized content", async () => {
    for (const body of [{ content: "Hello", authorId: staff.id }, { content: "   " }, { content: "x".repeat(2001) }]) {
      expect((await post("/api/tickets/9/comments", body)).status).toBe(422);
    }
    const response = await post("/api/tickets/9/comments", { content: "  Requester reply  " });
    expect(response.status).toBe(201);
    expect(publicCommentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: { ticketId: 9, authorId: requester.id, content: "Requester reply" } }));
  });

  it("allows staff-only notes but refuses terminal-ticket discussion creation", async () => {
    sessionFindUnique.mockResolvedValue(sessionFor(staff));
    expect((await post("/api/tickets/9/internal-notes", { content: "Private triage" })).status).toBe(201);
    expect(internalNoteCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorId: staff.id }) }));
    ticketFindUnique.mockResolvedValue({ id: 9, currentStatus: "CLOSED" });
    const terminal = await post("/api/tickets/9/internal-notes", { content: "Blocked" });
    expect(terminal.status).toBe(409);
  });

  it("keeps discussion endpoints append-only by exposing no edit or deletion routes", async () => {
    for (const method of ["put", "patch", "delete"] as const) {
      const response = await request(app)[method]("/api/tickets/9/comments/3")
        .set("Cookie", `toktickit_session=${token}`)
        .set("Origin", "http://localhost:5173")
        .set("X-CSRF-Token", csrf)
        .send({ content: "Attempted edit" });
      expect(response.status).toBe(404);
    }
  });

  it("records a requester indication once, returns the same indication on repeat, and refuses terminal status", async () => {
    const first = await post("/api/tickets/9/resolution-indication", { version: 4 });
    expect(first.status).toBe(200);
    expect(ticketUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 9, requesterId: requester.id, version: 4 } }));
    expect(ticketEventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "REQUESTER_RESOLUTION_INDICATED", actorId: requester.id }) }));

    const at = new Date("2026-09-17T00:00:00.000Z");
    ticketFindFirst.mockResolvedValue({ id: 9, version: 5, requesterId: requester.id, currentStatus: "OPEN", requesterResolvedAt: at, requesterResolvedById: requester.id });
    const repeated = await post("/api/tickets/9/resolution-indication", { version: 1 });
    expect(repeated.status).toBe(200);
    expect(repeated.body.requesterResolvedAt).toBe(at.toISOString());

    ticketFindFirst.mockResolvedValue({ id: 9, version: 5, requesterId: requester.id, currentStatus: "RESOLVED", requesterResolvedAt: null, requesterResolvedById: null });
    expect((await post("/api/tickets/9/resolution-indication", { version: 5 })).status).toBe(409);
  });
});
