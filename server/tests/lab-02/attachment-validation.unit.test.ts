import { describe, expect, it } from "vitest";
import { isPermittedAttachment, maximumAttachmentBytes, validateAttachmentRemoval } from "../../src/attachments.js";

describe("attachment validation", () => {
  it("accepts permitted MIME types at or below the five megabyte limit", () => {
    expect(isPermittedAttachment({ mimetype: "image/webp", size: maximumAttachmentBytes })).toEqual({ valid: true });
  });

  it("rejects an unsupported MIME type and an oversized file with specific safe errors", () => {
    expect(isPermittedAttachment({ mimetype: "text/plain", size: 12 })).toEqual({
      valid: false,
      status: 415,
      message: "Only JPEG, PNG, WEBP, and PDF files are supported.",
    });
    expect(isPermittedAttachment({ mimetype: "application/pdf", size: maximumAttachmentBytes + 1 })).toEqual({
      valid: false,
      status: 413,
      message: "Each attachment must be 5 MB or smaller.",
    });
  });

  it("trims a valid removal reason and rejects values outside the documented bounds", () => {
    expect(validateAttachmentRemoval({ requesterId: 2, reason: "  Duplicate screenshot  " })).toEqual({
      value: { requesterId: 2, reason: "Duplicate screenshot" },
    });
    expect(validateAttachmentRemoval({ requesterId: 2, reason: "bad" })).toEqual({
      fieldErrors: { reason: "Enter a removal reason between 5 and 250 characters." },
    });
  });
});
