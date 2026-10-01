import { describe, expect, it } from "vitest";
import { resolutionGate, type ResolutionEvidence } from "../../src/ticket-workflow.js";

const completedAt = new Date("2026-09-27T09:00:00.000Z");
const ready: ResolutionEvidence = {
  ownerActive: true,
  openActionCount: 0,
  latestCompletedAction: { completedAt, followUpRequired: false },
  latestReopenedAt: null,
};

describe("Lab 4 Ticket resolution gate", () => {
  it("accepts a completed Action with no outstanding follow-up", () => {
    expect(resolutionGate(ready)).toBeUndefined();
    expect(resolutionGate({ ...ready, latestReopenedAt: new Date("2026-09-27T08:00:00.000Z") })).toBeUndefined();
  });

  it("requires an active owner, no open Actions, and a completed Action", () => {
    expect(resolutionGate({ ...ready, ownerActive: false })?.message).toMatch(/active/i);
    expect(resolutionGate({ ...ready, openActionCount: 1 })?.message).toMatch(/open Action/i);
    expect(resolutionGate({ ...ready, latestCompletedAction: null })?.message).toMatch(/completed Action/i);
  });

  it("requires new completed work after the latest reopening", () => {
    expect(resolutionGate({ ...ready, latestReopenedAt: completedAt })?.message).toMatch(/after the latest reopening/i);
    expect(resolutionGate({ ...ready, latestReopenedAt: new Date("2026-09-27T10:00:00.000Z") })?.message).toMatch(/after the latest reopening/i);
  });

  it("uses only the latest completed Action to decide whether follow-up remains", () => {
    expect(resolutionGate({ ...ready, latestCompletedAction: { completedAt, followUpRequired: true } })?.message).toMatch(/no follow-up required/i);
    expect(resolutionGate(ready)).toBeUndefined();
  });
});
