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

export type Attachment = {
  id: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  removedAt: string | null;
  removedByRequesterId: number | null;
  removalReason: string | null;
};

export type TicketDetail = Ticket & {
  requester: Requester;
  attachments: Attachment[];
};

export type TicketListItem = Omit<Ticket, "description">;

export type TicketListQuery = {
  requesterId: number;
  search?: string;
  categoryId?: number;
  relatedSystemId?: number;
  requestedPriority?: RequestedPriority;
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber" | "requestedPriority";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: 10 | 20 | 50;
};

export type TicketListResponse = {
  items: TicketListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
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

export async function fetchTickets(query: TicketListQuery): Promise<TicketListResponse> {
  const parameters = new URLSearchParams({ requesterId: String(query.requesterId) });

  if (query.search?.trim()) parameters.set("search", query.search.trim());
  if (query.categoryId) parameters.set("categoryId", String(query.categoryId));
  if (query.relatedSystemId) parameters.set("relatedSystemId", String(query.relatedSystemId));
  if (query.requestedPriority) parameters.set("requestedPriority", query.requestedPriority);
  if (query.sortBy) parameters.set("sortBy", query.sortBy);
  if (query.sortOrder) parameters.set("sortOrder", query.sortOrder);
  if (query.page) parameters.set("page", String(query.page));
  if (query.pageSize) parameters.set("pageSize", String(query.pageSize));

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/tickets?${parameters.toString()}`);
  } catch {
    throw new TicketApiError("Unable to load Tickets. Please retry.");
  }

  const payload = await response.json().catch(() => null) as { message?: unknown } | null;

  if (!response.ok) {
    throw new TicketApiError(
      typeof payload?.message === "string" ? payload.message : "Unable to load Tickets. Please retry.",
    );
  }

  return payload as TicketListResponse;
}

export async function fetchTicket(ticketId: number, requesterId: number): Promise<TicketDetail> {
  return ticketRequest<TicketDetail>(`/api/tickets/${ticketId}?requesterId=${requesterId}`, "Unable to load the Ticket. Please retry.");
}

export async function uploadTicketAttachment(ticketId: number, requesterId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.set("requesterId", String(requesterId));
  formData.set("file", file);
  return ticketRequest<Attachment>(`/api/tickets/${ticketId}/attachments`, "Unable to upload the attachment. Please retry.", {
    method: "POST",
    body: formData,
  });
}

export async function removeTicketAttachment(ticketId: number, attachmentId: number, requesterId: number, reason: string): Promise<Attachment> {
  return ticketRequest<Attachment>(`/api/tickets/${ticketId}/attachments/${attachmentId}/remove`, "Unable to remove the attachment. Please retry.", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requesterId, reason }),
  });
}

export async function downloadTicketAttachment(ticketId: number, attachmentId: number, requesterId: number, filename: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments/${attachmentId}/download?requesterId=${requesterId}`);
  } catch {
    throw new TicketApiError("Unable to download the attachment. Please retry.");
  }

  if (!response.ok) throw new TicketApiError("Unable to download the attachment. Please retry.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

async function ticketRequest<T>(path: string, fallbackMessage: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, init);
  } catch {
    throw new TicketApiError(fallbackMessage);
  }

  const payload = await response.json().catch(() => null) as { message?: unknown; fieldErrors?: unknown } | null;
  if (!response.ok) {
    const fieldErrors = payload?.fieldErrors && typeof payload.fieldErrors === "object" && !Array.isArray(payload.fieldErrors)
      ? Object.fromEntries(Object.entries(payload.fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : undefined;
    throw new TicketApiError(typeof payload?.message === "string" ? payload.message : fallbackMessage, fieldErrors);
  }
  return payload as T;
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
