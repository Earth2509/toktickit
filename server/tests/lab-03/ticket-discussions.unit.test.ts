import { describe, expect, it } from "vitest";
import { canCreateDiscussion, canIndicateResolution, discussionPagination, validateDiscussionContent } from "../../src/ticket-discussions.js";

describe("Lab 3 Ticket discussions rules", () => {
  it("trims valid content and rejects blank or oversized entries", () => {
    expect(validateDiscussionContent("  A requester update.  ")).toBe("A requester update.");
    expect(validateDiscussionContent("   ")).toBeUndefined();
    expect(validateDiscussionContent("x".repeat(2001))).toBeUndefined();
  });

  it("uses only documented discussion page sizes", () => {
    expect(discussionPagination({})).toEqual({ page: 1, pageSize: 10 });
    expect(discussionPagination({ page: "2", pageSize: "50" })).toEqual({ page: 2, pageSize: 50 });
    expect(discussionPagination({ page: "0", pageSize: "25" })).toBeUndefined();
    expect(discussionPagination({ pageSiz: "50" })).toBeUndefined();
  });

  it("allows discussion on RESOLVED but not CLOSED or CANCELLED", () => {
    expect(canCreateDiscussion("RESOLVED")).toBe(true);
    expect(canCreateDiscussion("CLOSED")).toBe(false);
    expect(canCreateDiscussion("CANCELLED")).toBe(false);
  });

  it("allows requester indication only in eligible non-terminal states", () => {
    expect(canIndicateResolution("OPEN")).toBe(true);
    expect(canIndicateResolution("REOPENED")).toBe(true);
    expect(canIndicateResolution("RESOLVED")).toBe(false);
  });
});
