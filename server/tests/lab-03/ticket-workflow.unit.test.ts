import { describe, expect, it } from "vitest";
import { allowedTransitions, editableOperationalFields, workflowStatuses, workflowValidation } from "../../src/ticket-workflow.js";

describe("Lab 3 ticket workflow policy", () => {
  it("enforces the permitted status transition matrix", () => {
    expect(workflowValidation({ from: "NEW", to: "OPEN", ownerId: 7 })).toBeUndefined();
    expect(workflowValidation({ from: "NEW", to: "IN_PROGRESS", ownerId: 7 })).toMatchObject({ kind: "conflict", message: expect.stringMatching(/not permitted/i) });
  });

  it("checks every pair in the documented 8 by 8 transition matrix", () => {
    for (const from of workflowStatuses) {
      for (const to of workflowStatuses) {
        const result = workflowValidation({
          from,
          to,
          ownerId: 7,
          reason: "The requester confirmed the issue returned.",
          resolutionSummary: "The service was restored and verification completed.",
        });
        if (allowedTransitions[from].includes(to)) {
          expect(result, `${from} -> ${to}`).toBeUndefined();
        } else {
          expect(result, `${from} -> ${to}`).toMatchObject({ kind: "conflict" });
        }
      }
    }
  });

  it("requires an active owner and transition evidence where the contract requires it", () => {
    expect(workflowValidation({ from: "NEW", to: "OPEN", ownerId: null })).toMatchObject({ kind: "conflict", message: expect.stringMatching(/owner/i) });
    expect(workflowValidation({ from: "OPEN", to: "RESOLVED", ownerId: 7, resolutionSummary: "Fixed" })).toBeUndefined();
    expect(workflowValidation({ from: "OPEN", to: "CANCELLED", ownerId: 7, reason: "No" })).toMatchObject({ kind: "validation", message: expect.stringMatching(/reason/i) });
    expect(workflowValidation({ from: "RESOLVED", to: "REOPENED", ownerId: 7, reason: "Issue returned" })).toBeUndefined();
  });

  it("locks owner and priority mutation in terminal statuses", () => {
    expect(editableOperationalFields("OPEN")).toBe(true);
    expect(editableOperationalFields("RESOLVED")).toBe(false);
    expect(editableOperationalFields("CLOSED")).toBe(false);
    expect(editableOperationalFields("CANCELLED")).toBe(false);
  });
});
