import { createHash } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ticketCount = vi.fn();
const ticketFindMany = vi.fn();
const sessionFindUnique = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: { count: ticketCount, findMany: ticketFindMany },
  }),
}));

import { app } from "../../src/app.js";

const token = "my-tickets-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const user = {
  id: 1,
  displayName: "Authenticated Requester",
  email: "requester@example.test",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
  credentialVersion: 1,
};

function getTickets(query = "") {
  return request(app)
    .get(`/api/tickets${query}`)
    .set("Cookie", `toktickit_session=${token}`);
}

const listedTicket = {
  id: 42,
  ticketNumber: "TT-2026-000042",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 3,
  summary: "Campus Wi-Fi disconnects regularly",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: new Date("2026-08-29T08:00:00.000Z"),
  updatedAt: new Date("2026-08-29T08:00:00.000Z"),
  category: { id: 2, name: "Network" },
  relatedSystem: { id: 3, name: "Campus Wi-Fi" },
};

describe("GET /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionFindUnique.mockResolvedValue({
      tokenHash,
      userId: user.id,
      credentialVersion: user.credentialVersion,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    ticketCount.mockResolvedValue(1);
    ticketFindMany.mockResolvedValue([listedTicket]);
  });

  it("returns only owned Tickets using the documented default order and pagination", async () => {
    const response = await getTickets();

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, totalItems: 1, totalPages: 1 });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: 42,
      requesterId: 1,
      ticketNumber: "TT-2026-000042",
      category: { id: 2, name: "Network" },
      relatedSystem: { id: 3, name: "Campus Wi-Fi" },
    });
    expect(response.body.items[0]).not.toHaveProperty("description");
    expect(ticketCount).toHaveBeenCalledWith({ where: { requesterId: 1 } });
    expect(ticketFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { requesterId: 1 },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 10,
    }));
    expect(ticketFindMany.mock.calls[0][0].select).not.toHaveProperty("description");
  });

  it("applies search, all required filters, priority sort, and page metadata within the owner scope", async () => {
    ticketCount.mockResolvedValue(23);
    ticketFindMany.mockResolvedValue([listedTicket]);

    const response = await getTickets(
      "?search=wifi&categoryId=2&relatedSystemId=3&requestedPriority=HIGH&currentStatus=NEW&sortBy=requestedPriority&sortOrder=asc&page=2&pageSize=20",
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 2, pageSize: 20, totalItems: 23, totalPages: 2 });
    const expectedWhere = {
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 3,
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      OR: [
        { ticketNumber: { contains: "wifi", mode: "insensitive" } },
        { summary: { contains: "wifi", mode: "insensitive" } },
      ],
    };
    expect(ticketCount).toHaveBeenCalledWith({ where: expectedWhere });
    expect(ticketFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expectedWhere,
      orderBy: [{ requestedPriority: "asc" }, { id: "asc" }],
      skip: 20,
      take: 20,
    }));
  });

  it("keeps a usable single-page contract for an empty owner result", async () => {
    ticketCount.mockResolvedValue(0);
    ticketFindMany.mockResolvedValue([]);

    const response = await getTickets("?search=unmatched");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  });

  it("returns field-safe 400 errors for malformed list queries", async () => {
    const response = await getTickets("?pageSize=25&sortBy=summary");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Ticket list query validation failed",
      fieldErrors: {
        sortBy: "Choose one of: createdAt, updatedAt, ticketNumber, requestedPriority.",
        pageSize: "Choose 10, 20, or 50.",
      },
    });
  });

  it("returns a safe service error when Ticket storage is unavailable", async () => {
    ticketCount.mockRejectedValue(Object.assign(new Error("database unavailable"), { code: "P1001" }));

    const response = await getTickets();

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Ticket service is temporarily unavailable." });
  });
});
