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

export function isPermittedAttachment(file: { mimetype: string; size: number }): { valid: true } | { valid: false; status: 413 | 415; message: string } {
  if (!permittedAttachmentTypes.has(file.mimetype)) {
    return { valid: false, status: 415, message: "Only JPEG, PNG, WEBP, and PDF files are supported." };
  }

  if (file.size > maximumAttachmentBytes) {
    return { valid: false, status: 413, message: "Each attachment must be 5 MB or smaller." };
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
