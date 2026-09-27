import { describe, expect, it } from "vitest";
import { staffQueueWhere, validateStaffQueueQuery } from "../../src/staff-queue.js";

describe("Lab 4 Dashboard queue filters", () => {
  it("resolves owner=me from the signed-in Staff id", () => {
    const result = validateStaffQueueQuery({ owner: "me", currentStatus: "NEW,OPEN,IN_PROGRESS,WAITING_FOR_REQUESTER,REOPENED" }, 77);
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(staffQueueWhere(result.value)).toMatchObject({ ownerId: 77, currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] } });
  });

  it("rejects conflicting owner aliases and malformed comma-separated values", () => {
    const result = validateStaffQueueQuery({ owner: "me", ownerId: "1", itPriority: "HIGH,UNKNOWN" }, 77);
    expect("fieldErrors" in result && result.fieldErrors).toMatchObject({ owner: expect.any(String), itPriority: expect.any(String) });
  });
});
