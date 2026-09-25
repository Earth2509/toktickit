import { describe, expect, it } from "vitest";
import { parseActionTakenCreate, parseActionTakenPatch, validateActionValues } from "../../src/actions-taken.js";

const actionAt = "2026-09-25T08:00:00.000Z";
const now = new Date("2026-09-25T08:05:00.000Z");

describe("Lab 4 Action Taken validation", () => {
  it("normalizes a valid open Action and clears a note when follow-up is false", () => {
    const parsed = parseActionTakenCreate({
      actionAt,
      description: "  Investigated the sign-in failure.  ",
      assignedToId: 7,
      followUpRequired: false,
      followUpNote: "This must not be persisted",
    }, now);
    expect("value" in parsed && parsed.value).toMatchObject({ description: "Investigated the sign-in failure.", status: "OPEN", result: null, followUpNote: null });
  });

  it("rejects a future action time and incomplete follow-up evidence", () => {
    expect(parseActionTakenCreate({ actionAt: "2026-09-25T08:11:00.000Z", description: "Investigated", assignedToId: 7, followUpRequired: false }, now)).toMatchObject({ validation: expect.any(String) });
    expect(parseActionTakenCreate({ actionAt, description: "Investigated", assignedToId: 7, followUpRequired: true }, now)).toMatchObject({ validation: expect.stringContaining("follow-up") });
  });

  it("requires a result for completion and keeps terminal transitions one-way", () => {
    expect(validateActionValues({ status: "COMPLETED", result: null, followUpRequired: false, followUpNote: null })).toContain("requires a result");
    expect(parseActionTakenPatch({ version: 3, status: "OPEN" })).toMatchObject({ validation: expect.stringContaining("only transition") });
  });

  it("distinguishes unknown body fields from invalid known fields", () => {
    expect(parseActionTakenCreate({ actionAt, description: "Investigated", assignedToId: 7, followUpRequired: false, performedById: 99 }, now)).toMatchObject({ badRequest: expect.any(String) });
    expect(parseActionTakenPatch({ version: 3, assignedToId: 0 })).toMatchObject({ validation: expect.any(String) });
  });
});
