import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requesterFindFirst = vi.fn();
const ticketCount = vi.fn();
const ticketFindMany = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requester: { findFirst: requesterFindFirst },
    ticket: { count: ticketCount, findMany: ticketFindMany },
  }),
}));

import { app } from "../../src/app.js";

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
    requesterFindFirst.mockResolvedValue({ id: 1 });
    ticketCount.mockResolvedValue(1);
    ticketFindMany.mockResolvedValue([listedTicket]);
  });

  it("returns only owned Tickets using the documented default order and pagination", async () => {
    const response = await request(app).get("/api/tickets?requesterId=1");

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
    expect(requesterFindFirst).toHaveBeenCalledWith({ where: { id: 1, isActive: true }, select: { id: true } });
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

    const response = await request(app).get(
      "/api/tickets?requesterId=1&search=wifi&categoryId=2&relatedSystemId=3&requestedPriority=HIGH&currentStatus=NEW&sortBy=requestedPriority&sortOrder=asc&page=2&pageSize=20",
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

    const response = await request(app).get("/api/tickets?requesterId=1&search=unmatched");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  });

  it("keeps ticket data owner-scoped when the Development Requester changes", async () => {
    requesterFindFirst.mockImplementation(({ where }: { where: { id: number } }) => Promise.resolve({ id: where.id }));
    ticketCount.mockImplementation(({ where }: { where: { requesterId: number } }) => Promise.resolve(where.requesterId === 1 ? 1 : 0));
    ticketFindMany.mockImplementation(({ where }: { where: { requesterId: number } }) => Promise.resolve(where.requesterId === 1 ? [listedTicket] : []));

    const response = await request(app).get("/api/tickets?requesterId=2");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
    expect(ticketFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { requesterId: 2 } }));
  });

  it("returns a safe not-found response before querying Tickets for an inactive or unknown requester", async () => {
    requesterFindFirst.mockResolvedValue(null);

    const response = await request(app).get("/api/tickets?requesterId=99");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Requester is unavailable." });
    expect(ticketCount).not.toHaveBeenCalled();
    expect(ticketFindMany).not.toHaveBeenCalled();
  });

  it("returns field-safe 400 errors for malformed list queries", async () => {
    const response = await request(app).get("/api/tickets?requesterId=0&pageSize=25&sortBy=summary");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Ticket list query validation failed",
      fieldErrors: {
        requesterId: "Provide a positive whole number.",
        sortBy: "Choose one of: createdAt, updatedAt, ticketNumber, requestedPriority.",
        pageSize: "Choose 10, 20, or 50.",
      },
    });
    expect(requesterFindFirst).not.toHaveBeenCalled();
  });

  it("returns a safe service error when Ticket storage is unavailable", async () => {
    ticketCount.mockRejectedValue(Object.assign(new Error("database unavailable"), { code: "P1001" }));

    const response = await request(app).get("/api/tickets?requesterId=1");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Ticket service is temporarily unavailable." });
  });
});
