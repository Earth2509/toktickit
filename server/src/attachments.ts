export const permittedAttachmentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const maximumAttachmentBytes = 5 * 1024 * 1024;
export const maximumActiveAttachments = 5;

export type RemovalValidation =
  | { value: { requesterId: number; reason: string }; fieldErrors?: never }
  | { value?: never; fieldErrors: Record<string, string> };

export function isPermittedAttachment(file: { mimetype: string; size: number; buffer: Buffer }): { valid: true } | { valid: false; status: 413 | 415; message: string } {
  if (!permittedAttachmentTypes.has(file.mimetype)) {
    return { valid: false, status: 415, message: "Only JPEG, PNG, WEBP, and PDF files are supported." };
  }

  if (file.size > maximumAttachmentBytes) {
    return { valid: false, status: 413, message: "Each attachment must be 5 MB or smaller." };
  }

  const detectedType = detectedAttachmentType(file.buffer);
  if (!detectedType) {
    return { valid: false, status: 415, message: "The attachment content is not a supported file type." };
  }

  if (detectedType !== file.mimetype) {
    return { valid: false, status: 415, message: "The attachment content does not match its declared file type." };
  }

  return { valid: true };
}

export function validateAttachmentRemoval(body: unknown): RemovalValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { fieldErrors: { request: "A JSON object is required." } };
  }

  const input = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const requesterId = positiveInteger(input.requesterId, "requesterId", fieldErrors);
  const reason = removalReason(input.reason, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { value: { requesterId: requesterId!, reason: reason! } };
}

export function positiveAttachmentInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function positiveInteger(value: unknown, field: string, fieldErrors: Record<string, string>): number | undefined {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    fieldErrors[field] = "Provide a positive whole number.";
    return undefined;
  }
  return value;
}

function removalReason(value: unknown, fieldErrors: Record<string, string>): string | undefined {
  if (typeof value !== "string") {
    fieldErrors.reason = "Enter a removal reason between 5 and 250 characters.";
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length < 5 || trimmed.length > 250) {
    fieldErrors.reason = "Enter a removal reason between 5 and 250 characters.";
    return undefined;
  }
  return trimmed;
}

function detectedAttachmentType(buffer: Buffer): string | undefined {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).equals(Buffer.from("RIFF")) && buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) return "image/webp";
  if (buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "application/pdf";
  return undefined;
}
