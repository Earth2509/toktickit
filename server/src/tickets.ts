export const requestedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type RequestedPriorityValue = (typeof requestedPriorities)[number];

export type NormalizedTicketCreate = {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: RequestedPriorityValue;
  idempotencyKey: string;
};

export type TicketCreateValidation =
  | { value: NormalizedTicketCreate; fieldErrors?: never }
  | { value?: never; fieldErrors: Record<string, string> };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateTicketCreate(body: unknown): TicketCreateValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { fieldErrors: { request: "A JSON object is required." } };
  }

  const input = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const requesterId = positiveInteger(input.requesterId, "requesterId", fieldErrors);
  const categoryId = positiveInteger(input.categoryId, "categoryId", fieldErrors);
  const relatedSystemId = positiveInteger(input.relatedSystemId, "relatedSystemId", fieldErrors);
  const summary = trimmedString(input.summary, "summary", 5, 120, fieldErrors);
  const description = trimmedString(input.description, "description", 10, 2000, fieldErrors);
  const requestedPriority = priorityValue(input.requestedPriority, fieldErrors);
  const idempotencyKey = uuidValue(input.idempotencyKey, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    value: {
      requesterId: requesterId!,
      categoryId: categoryId!,
      relatedSystemId: relatedSystemId!,
      summary: summary!,
      description: description!,
      requestedPriority: requestedPriority!,
      idempotencyKey: idempotencyKey!,
    },
  };
}

export function formatTicketNumber(id: number, createdAt: Date): string {
  return `TT-${createdAt.getUTCFullYear()}-${String(id).padStart(6, "0")}`;
}

export function matchesTicketCreate(
  ticket: Pick<NormalizedTicketCreate, "requesterId" | "categoryId" | "relatedSystemId" | "summary" | "description" | "requestedPriority">,
  input: NormalizedTicketCreate,
): boolean {
  return ticket.requesterId === input.requesterId
    && ticket.categoryId === input.categoryId
    && ticket.relatedSystemId === input.relatedSystemId
    && ticket.summary === input.summary
    && ticket.description === input.description
    && ticket.requestedPriority === input.requestedPriority;
}

function positiveInteger(value: unknown, field: string, fieldErrors: Record<string, string>): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    fieldErrors[field] = "Select a valid value.";
    return undefined;
  }

  return value;
}

function trimmedString(
  value: unknown,
  field: string,
  minimumLength: number,
  maximumLength: number,
  fieldErrors: Record<string, string>,
): string | undefined {
  if (typeof value !== "string") {
    fieldErrors[field] = `Enter ${minimumLength}-${maximumLength} characters.`;
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length < minimumLength || trimmed.length > maximumLength) {
    fieldErrors[field] = `Enter ${minimumLength}-${maximumLength} characters.`;
    return undefined;
  }

  return trimmed;
}

function priorityValue(value: unknown, fieldErrors: Record<string, string>): RequestedPriorityValue | undefined {
  if (typeof value !== "string" || !requestedPriorities.includes(value as RequestedPriorityValue)) {
    fieldErrors.requestedPriority = "Select LOW, MEDIUM, HIGH, or URGENT.";
    return undefined;
  }

  return value as RequestedPriorityValue;
}

function uuidValue(value: unknown, fieldErrors: Record<string, string>): string | undefined {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    fieldErrors.idempotencyKey = "Provide a valid idempotency UUID.";
    return undefined;
  }

  return value.toLowerCase();
}
