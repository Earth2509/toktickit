import { describe, expect, it } from "vitest";
import { ticketListOrderBy, ticketListWhere, validateTicketListQuery } from "../../src/ticket-query.js";

describe("My Tickets query validation", () => {
  it("uses the documented defaults and requester scope", () => {
    const result = validateTicketListQuery({ requesterId: "7" });

    expect(result).toEqual({
      value: {
        requesterId: 7,
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        pageSize: 10,
      },
    });
  });

  it("normalizes the supported filters, sort, and pagination", () => {
    const result = validateTicketListQuery({
      requesterId: "7",
      search: "  TT-2026  ",
      categoryId: "2",
      relatedSystemId: "3",
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      sortBy: "requestedPriority",
      sortOrder: "asc",
      page: "2",
      pageSize: "20",
    });

    expect(result.value).toEqual({
      requesterId: 7,
      search: "TT-2026",
      categoryId: 2,
      relatedSystemId: 3,
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      sortBy: "requestedPriority",
      sortOrder: "asc",
      page: 2,
      pageSize: 20,
    });
  });

  it("reports malformed query values without constructing a partial query", () => {
    const result = validateTicketListQuery({
      requesterId: "0",
      categoryId: "two",
      relatedSystemId: ["3", "4"],
      requestedPriority: "NOW",
      currentStatus: "CLOSED",
      sortBy: "summary",
      sortOrder: "sideways",
      page: "0",
      pageSize: "25",
      search: "x".repeat(121),
    });

    expect(result.value).toBeUndefined();
    expect(result.fieldErrors).toMatchObject({
      requesterId: "Provide a positive whole number.",
      categoryId: "Provide a positive whole number.",
      relatedSystemId: "Provide a positive whole number.",
      requestedPriority: "Choose one of: LOW, MEDIUM, HIGH, URGENT.",
      currentStatus: "Choose one of: NEW.",
      sortBy: "Choose one of: createdAt, updatedAt, ticketNumber, requestedPriority.",
      sortOrder: "Choose one of: asc, desc.",
      page: "Provide a positive whole number.",
      pageSize: "Choose 10, 20, or 50.",
      search: "Enter at most 120 characters.",
    });
  });

  it("builds an owner-scoped case-insensitive search and severity order", () => {
    const result = validateTicketListQuery({
      requesterId: "7",
      search: "network",
      requestedPriority: "HIGH",
      sortBy: "requestedPriority",
      sortOrder: "asc",
    });

    expect(result.value).toBeDefined();
    expect(ticketListWhere(result.value!)).toEqual({
      requesterId: 7,
      requestedPriority: "HIGH",
      OR: [
        { ticketNumber: { contains: "network", mode: "insensitive" } },
        { summary: { contains: "network", mode: "insensitive" } },
      ],
    });
    expect(ticketListOrderBy(result.value!)).toEqual([{ requestedPriority: "asc" }, { id: "asc" }]);
  });

  it("uses a deterministic secondary ID order for every supported sort", () => {
    const ticketNumberSort = validateTicketListQuery({
      requesterId: "7",
      sortBy: "ticketNumber",
      sortOrder: "desc",
    });
    const updatedSort = validateTicketListQuery({
      requesterId: "7",
      sortBy: "updatedAt",
      sortOrder: "asc",
    });

    expect(ticketListOrderBy(ticketNumberSort.value!)).toEqual([{ ticketNumber: "desc" }, { id: "desc" }]);
    expect(ticketListOrderBy(updatedSort.value!)).toEqual([{ updatedAt: "asc" }, { id: "asc" }]);
  });
});
