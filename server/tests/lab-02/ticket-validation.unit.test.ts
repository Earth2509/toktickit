import { describe, expect, it } from "vitest";
import { validateTicketCreate } from "../../src/tickets.js";

const validBody = {
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 3,
  summary: "  Cannot connect to the campus network  ",
  description: "  The wireless connection drops every few minutes.  ",
  requestedPriority: "HIGH",
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
};

describe("Ticket creation validation", () => {
  it("normalizes a valid creation payload before persistence", () => {
    expect(validateTicketCreate(validBody)).toEqual({
      value: {
        ...validBody,
        summary: "Cannot connect to the campus network",
        description: "The wireless connection drops every few minutes.",
      },
    });
  });

  it("returns field-level errors for invalid values without producing a partial payload", () => {
    const result = validateTicketCreate({
      ...validBody,
      requesterId: 0,
      summary: "bad",
      description: "short",
      requestedPriority: "NOW",
      idempotencyKey: "not-a-uuid",
    });

    expect(result.value).toBeUndefined();
    expect(result.fieldErrors).toMatchObject({
      requesterId: "Select a valid value.",
      summary: "Enter 5-120 characters.",
      description: "Enter 10-2000 characters.",
      requestedPriority: "Select LOW, MEDIUM, HIGH, or URGENT.",
      idempotencyKey: "Provide a valid idempotency UUID.",
    });
  });
});
