import { describe, expect, it } from "vitest";
import { isPermittedAttachment, maximumAttachmentBytes, validateAttachmentRemoval } from "../../src/attachments.js";

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("attachment validation", () => {
  it("accepts permitted MIME types at or below the five megabyte limit", () => {
    const fiveMegabytePng = Buffer.concat([pngHeader, Buffer.alloc(maximumAttachmentBytes - pngHeader.length)]);
    expect(isPermittedAttachment({ mimetype: "image/png", size: maximumAttachmentBytes, buffer: fiveMegabytePng })).toEqual({ valid: true });
  });

  it("rejects an unsupported MIME type, oversized file, and forged declared type", () => {
    expect(isPermittedAttachment({ mimetype: "text/plain", size: 12, buffer: Buffer.from("notes") })).toEqual({
      valid: false,
      status: 415,
      message: "Only JPEG, PNG, WEBP, and PDF files are supported.",
    });
    expect(isPermittedAttachment({ mimetype: "application/pdf", size: maximumAttachmentBytes + 1, buffer: Buffer.alloc(maximumAttachmentBytes + 1) })).toEqual({
      valid: false,
      status: 413,
      message: "Each attachment must be 5 MB or smaller.",
    });
    expect(isPermittedAttachment({ mimetype: "image/png", size: 2, buffer: Buffer.from("MZ") })).toEqual({
      valid: false,
      status: 415,
      message: "The attachment content is not a supported file type.",
    });
    expect(isPermittedAttachment({ mimetype: "image/png", size: 5, buffer: Buffer.from("%PDF-") })).toEqual({
      valid: false,
      status: 415,
      message: "The attachment content does not match its declared file type.",
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
