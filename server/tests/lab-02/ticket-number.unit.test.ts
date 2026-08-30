import { describe, expect, it } from "vitest";
import { formatTicketNumber } from "../../src/tickets.js";

describe("Ticket number generation", () => {
  it("formats a persisted Ticket id as TT-YYYY-000001", () => {
    expect(formatTicketNumber(42, new Date("2026-08-28T12:00:00.000Z"))).toBe("TT-2026-000042");
  });

  it("uses the UTC creation year and pads the numeric sequence", () => {
    expect(formatTicketNumber(7, new Date("2027-01-01T00:00:00.000Z"))).toBe("TT-2027-000007");
  });
});
