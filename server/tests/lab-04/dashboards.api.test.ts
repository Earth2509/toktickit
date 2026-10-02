import { createHash } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFindUnique = vi.fn();
const ticketCount = vi.fn();
const ticketFindMany = vi.fn();
const actionCount = vi.fn();
const actionFindMany = vi.fn();

vi.mock("../../src/prisma.js", () => ({ getPrisma: () => ({
  session: { findUnique: sessionFindUnique },
  ticket: { count: ticketCount, findMany: ticketFindMany },
  actionTaken: { count: actionCount, findMany: actionFindMany },
}) }));

import { app } from "../../src/app.js";

const token = "lab4-dashboard-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const requester = { id: 21, displayName: "Requester", email: "requester@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false, credentialVersion: 1 };
const staff = { ...requester, id: 31, displayName: "Staff", role: "IT_STAFF" };
const admin = { ...staff, id: 41, role: "ADMINISTRATOR" };
const get = (path: string) => request(app).get(path).set("Cookie", `toktickit_session=${token}`);

function signIn(user: typeof requester) {
  sessionFindUnique.mockResolvedValue({ tokenHash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt: new Date(Date.now() + 60_000), user });
}

describe("Lab 4 Dashboard API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn(requester);
    ticketCount.mockResolvedValue(0);
    ticketFindMany.mockResolvedValue([]);
    actionCount.mockResolvedValue(0);
    actionFindMany.mockResolvedValue([]);
  });

  it("requires authentication and isolates the two dashboard roles", async () => {
    sessionFindUnique.mockResolvedValueOnce(null);
    expect((await get("/api/requester/dashboard")).status).toBe(401);
    expect((await get("/api/staff/dashboard")).status).toBe(403);
    signIn(staff);
    expect((await get("/api/requester/dashboard")).status).toBe(403);
    expect((await get("/api/staff/dashboard")).status).toBe(200);
    signIn(admin);
    expect((await get("/api/staff/dashboard")).status).toBe(200);
  });

  it("calculates requester metrics from owned Tickets and returns five ordered rows", async () => {
    ticketCount.mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    ticketFindMany.mockResolvedValue([{ id: 7, ticketNumber: "TT-7" }]);
    const beforeRequest = Date.now();
    const response = await get("/api/requester/dashboard");
    const afterRequest = Date.now();
    expect(response.status).toBe(200);
    expect(response.body.metrics).toEqual({ openTickets: 3, waitingForRequester: 1, recentlyUpdated: 2, recentlyResolved: 1 });
    expect(response.body.recentTickets).toEqual([{ id: 7, ticketNumber: "TT-7" }]);
    for (const [call] of ticketCount.mock.calls) expect(call.where.requesterId).toBe(requester.id);
    expect(ticketCount.mock.calls[3][0].where).toMatchObject({
      requesterId: requester.id,
      currentStatus: { in: ["RESOLVED", "CLOSED"] },
      events: { some: { type: "STATUS_CHANGED", after: { path: ["currentStatus"], equals: "RESOLVED" }, createdAt: { gte: expect.any(Date) } } },
    });
    const resolutionCutoff = ticketCount.mock.calls[3][0].where.events.some.createdAt.gte as Date;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(resolutionCutoff.getTime()).toBeGreaterThanOrEqual(beforeRequest - thirtyDays);
    expect(resolutionCutoff.getTime()).toBeLessThanOrEqual(afterRequest - thirtyDays);
    expect(ticketFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { requesterId: requester.id }, take: 5, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }));
  });

  it("returns zero counts and a separate empty recent list", async () => {
    const response = await get("/api/requester/dashboard");
    expect(response.body).toEqual({ metrics: { openTickets: 0, waitingForRequester: 0, recentlyUpdated: 0, recentlyResolved: 0 }, recentTickets: [] });
  });

  it("applies the Requester card drill-down to the owned list", async () => {
    const response = await get("/api/tickets?currentStatus=RESOLVED,CLOSED&resolvedWithinDays=30");
    expect(response.status).toBe(200);
    expect(ticketCount).toHaveBeenCalledWith({ where: expect.objectContaining({
      requesterId: requester.id,
      currentStatus: { in: ["RESOLVED", "CLOSED"] },
      events: { some: expect.objectContaining({ type: "STATUS_CHANGED" }) },
    }) });
    expect((await get("/api/tickets?updatedWithinDays=30&sort=recent")).status).toBe(200);
    expect(ticketFindMany).toHaveBeenLastCalledWith(expect.objectContaining({ orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }));
  });

  it("calculates staff metrics using session ownership and excludes terminal Tickets", async () => {
    signIn(staff);
    ticketCount.mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    const response = await get("/api/staff/dashboard");
    expect(response.status).toBe(200);
    expect(response.body.metrics).toEqual({ unassignedTickets: 4, ownedByMe: 2, urgentTickets: 3, waitingForRequester: 1 });
    expect(ticketCount.mock.calls[0][0].where).toEqual({ ownerId: null, currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] } });
    expect(ticketCount.mock.calls[1][0].where.ownerId).toBe(staff.id);
    expect(ticketCount.mock.calls[2][0].where.itPriority).toEqual({ in: ["HIGH", "URGENT"] });
    expect(ticketFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5, orderBy: [{ updatedAt: "desc" }, { id: "desc" }] }));
  });

  it("applies owner=me securely to Staff Queue and rejects conflicting aliases", async () => {
    signIn(staff);
    const response = await get("/api/staff/tickets?owner=me&currentStatus=NEW,OPEN");
    expect(response.status).toBe(200);
    expect(ticketCount).toHaveBeenCalledWith({ where: expect.objectContaining({ ownerId: staff.id, currentStatus: { in: ["NEW", "OPEN"] } }) });
    expect((await get("/api/staff/tickets?owner=me&ownerId=unassigned")).status).toBe(400);
    expect((await get("/api/staff/tickets?updatedWithinDays=30")).status).toBe(400);
  });

  it("returns only session-performed Actions, bounded and stably ordered, ignoring a forged actor query", async () => {
    signIn(staff);
    actionCount.mockResolvedValue(8);
    const item = { id: 7, description: "Diagnostic work", status: "COMPLETED", ticket: { id: 9, ticketNumber: "TT-9" } };
    actionFindMany.mockResolvedValue([item]);
    const response = await get("/api/staff/dashboard?performedById=999&assignedToId=999");
    expect(response.status).toBe(200);
    expect(response.body.totalPerformedActions).toBe(8);
    expect(response.body.recentActions).toEqual([item]);
    expect(actionCount).toHaveBeenCalledWith({ where: { performedById: staff.id } });
    expect(actionFindMany).toHaveBeenCalledWith({
      where: { performedById: staff.id }, orderBy: [{ actionAt: "desc" }, { id: "desc" }], take: 5,
      select: {
        id: true, actionAt: true, completedAt: true, description: true, status: true, followUpRequired: true,
        assignedTo: { select: { id: true, displayName: true } },
        ticket: { select: { id: true, ticketNumber: true, currentStatus: true } },
      },
    });
  });

  it("returns an explicit empty own-Action list for an Administrator's own session", async () => {
    signIn(admin);
    const response = await get("/api/staff/dashboard");
    expect(response.status).toBe(200);
    expect(response.body.totalPerformedActions).toBe(0);
    expect(response.body.recentActions).toEqual([]);
    expect(actionCount).toHaveBeenCalledWith({ where: { performedById: admin.id } });
  });

  it("denies Requesters before querying Actions", async () => {
    expect((await get("/api/staff/dashboard")).status).toBe(403);
    expect(actionCount).not.toHaveBeenCalled();
    expect(actionFindMany).not.toHaveBeenCalled();
  });

  it("fails safely without partial data when the own-Action query fails", async () => {
    signIn(staff);
    actionFindMany.mockRejectedValueOnce(new Error("database connection secret"));
    const response = await get("/api/staff/dashboard");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ code: "UNAVAILABLE", message: "Staff dashboard is temporarily unavailable." });
    expect(response.body.metrics).toBeUndefined();
  });

  it("returns a safe failure when dashboard queries fail", async () => {
    ticketCount.mockRejectedValue(new Error("database connection secret"));
    const response = await get("/api/requester/dashboard");
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain("secret");
  });
});
