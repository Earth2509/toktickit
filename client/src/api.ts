const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Category = {
  id: number;
  name: string;
};

export type RelatedSystem = {
  id: number;
  name: string;
};

export type Requester = {
  id: number;
  displayName: string;
  email: string;
};

export const requestedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type RequestedPriority = (typeof requestedPriorities)[number];

export type CreateTicketInput = {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  idempotencyKey: string;
};

export type Ticket = {
  id: number;
  ticketNumber: string;
  requesterId: number;
  category: Category;
  relatedSystem: RelatedSystem;
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  currentStatus: "NEW";
  createdAt: string;
  updatedAt: string;
};

export class TicketApiError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "TicketApiError";
    this.fieldErrors = fieldErrors;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchReferenceData<Category[]>("/api/categories", "Unable to load request categories");
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  return fetchReferenceData<RelatedSystem[]>("/api/related-systems", "Unable to load related systems");
}

export async function fetchRequesters(): Promise<Requester[]> {
  return fetchReferenceData<Requester[]>("/api/requesters", "Unable to load Development Requesters");
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  let response: Response;

  try {
    response = await fetch(API_BASE_URL + "/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new TicketApiError("Unable to create the Ticket. Please try again.");
  }

  const payload = await response.json().catch(() => null) as {
    message?: unknown;
    fieldErrors?: unknown;
  } | null;

  if (!response.ok) {
    const message = typeof payload?.message === "string"
      ? payload.message
      : "Unable to create the Ticket. Please try again.";
    const fieldErrors = payload?.fieldErrors && typeof payload.fieldErrors === "object" && !Array.isArray(payload.fieldErrors)
      ? Object.fromEntries(Object.entries(payload.fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : undefined;
    throw new TicketApiError(message, fieldErrors);
  }

  return payload as Ticket;
}

async function fetchReferenceData<T>(path: string, errorMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(API_BASE_URL + path);
  } catch {
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
