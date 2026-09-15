import { describe, expect, it } from "vitest";
import { editableOperationalFields, workflowValidation } from "../../src/ticket-workflow.js";

describe("Lab 3 ticket workflow policy", () => {
  it("enforces the permitted status transition matrix", () => {
    expect(workflowValidation({ from: "NEW", to: "OPEN", ownerId: 7 })).toBeUndefined();
    expect(workflowValidation({ from: "NEW", to: "IN_PROGRESS", ownerId: 7 })).toMatch(/not permitted/i);
  });

  it("requires an active owner and transition evidence where the contract requires it", () => {
    expect(workflowValidation({ from: "NEW", to: "OPEN", ownerId: null })).toMatch(/owner/i);
    expect(workflowValidation({ from: "OPEN", to: "RESOLVED", ownerId: 7, resolutionSummary: "Fixed" })).toBeUndefined();
    expect(workflowValidation({ from: "OPEN", to: "CANCELLED", ownerId: 7, reason: "No" })).toMatch(/reason/i);
    expect(workflowValidation({ from: "RESOLVED", to: "REOPENED", ownerId: 7, reason: "Issue returned" })).toBeUndefined();
  });

  it("locks owner and priority mutation in terminal statuses", () => {
    expect(editableOperationalFields("OPEN")).toBe(true);
    expect(editableOperationalFields("RESOLVED")).toBe(false);
    expect(editableOperationalFields("CLOSED")).toBe(false);
    expect(editableOperationalFields("CANCELLED")).toBe(false);
  });
});
