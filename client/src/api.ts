export type Category = {
  id: number;
  name: string;
};

export type RelatedSystem = {
  id: number;
  name: string;
};

export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export type AuthUser = {
  id: number;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
};

export type Requester = AuthUser;

export type AuthSession = { user: AuthUser; csrfToken: string; expiresAt: string };

let csrfToken = "";
export const sessionExpiredEvent = "toktickit:session-expired";

export const requestedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type RequestedPriority = (typeof requestedPriorities)[number];

export type CreateTicketInput = {
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
  currentStatus: "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED";
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
  owner?: Pick<AuthUser, "id" | "displayName" | "role" | "isActive"> | null;
  ownerId?: number | null;
  itPriority?: RequestedPriority;
  version?: number;
  resolutionSummary?: string | null;
};

export type TicketListItem = Omit<Ticket, "description">;

export type TicketListQuery = {
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

export type StaffQueueTicket = Omit<Ticket, "description" | "requesterId"> & {
  itPriority: RequestedPriority;
  requester: Pick<AuthUser, "id" | "displayName">;
  owner: Pick<AuthUser, "id" | "displayName" | "role"> | null;
};

export type StaffQueueQuery = {
  search?: string;
  categoryId?: number;
  relatedSystemId?: number;
  requestedPriority?: RequestedPriority;
  itPriority?: RequestedPriority;
  currentStatus?: Ticket["currentStatus"];
  ownerId?: number | "unassigned";
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber" | "itPriority" | "currentStatus";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: 10 | 20 | 50;
};

export type StaffQueueResponse = Omit<TicketListResponse, "items"> & { items: StaffQueueTicket[] };

export class TicketApiError extends Error {
  fieldErrors?: Record<string, string>;
  code?: string;
  status?: number;
  retryAfter?: number;

  constructor(message: string, fieldErrors?: Record<string, string>, code?: string, status?: number, retryAfter?: number) {
    super(message);
    this.name = "TicketApiError";
    this.fieldErrors = fieldErrors;
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function login(email: string, password: string): Promise<AuthSession> {
  return authRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function fetchCurrentUser(): Promise<AuthSession> {
  return authRequest("/api/auth/me");
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthSession> {
  return authRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: csrfHeaders(),
  });
  csrfToken = "";
  if (!response.ok) throw await apiError(response, "Unable to sign out. Please retry.");
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchReferenceData<Category[]>("/api/categories", "Unable to load request categories");
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  return fetchReferenceData<RelatedSystem[]>("/api/related-systems", "Unable to load related systems");
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  let response: Response;

  try {
    response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify(input),
      credentials: "same-origin",
    });
  } catch {
    throw new TicketApiError("Unable to create the Ticket. Please try again.");
  }

  const payload = await response.json().catch(() => null) as {
    message?: unknown;
    fieldErrors?: unknown;
  } | null;

  if (!response.ok) {
    throw errorFromPayload(response, payload, "Unable to create the Ticket. Please try again.");
  }

  return payload as Ticket;
}

export async function fetchTickets(query: TicketListQuery): Promise<TicketListResponse> {
  const parameters = new URLSearchParams();

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
    response = await fetch(`/api/tickets?${parameters.toString()}`, { credentials: "same-origin" });
  } catch {
    throw new TicketApiError("Unable to load Tickets. Please retry.");
  }

  const payload = await response.json().catch(() => null) as { message?: unknown } | null;

  if (!response.ok) {
    throw errorFromPayload(response, payload, "Unable to load Tickets. Please retry.");
  }

  return payload as TicketListResponse;
}

export async function fetchTicket(ticketId: number): Promise<TicketDetail> {
  return ticketRequest<TicketDetail>(`/api/tickets/${ticketId}`, "Unable to load the Ticket. Please retry.");
}

export async function fetchStaffQueue(query: StaffQueueQuery): Promise<StaffQueueResponse> {
  const parameters = new URLSearchParams();
  if (query.search?.trim()) parameters.set("search", query.search.trim());
  if (query.categoryId) parameters.set("categoryId", String(query.categoryId));
  if (query.relatedSystemId) parameters.set("relatedSystemId", String(query.relatedSystemId));
  if (query.requestedPriority) parameters.set("requestedPriority", query.requestedPriority);
  if (query.itPriority) parameters.set("itPriority", query.itPriority);
  if (query.currentStatus) parameters.set("currentStatus", query.currentStatus);
  if (query.ownerId) parameters.set("ownerId", String(query.ownerId));
  if (query.sortBy) parameters.set("sortBy", query.sortBy);
  if (query.sortOrder) parameters.set("sortOrder", query.sortOrder);
  if (query.page) parameters.set("page", String(query.page));
  if (query.pageSize) parameters.set("pageSize", String(query.pageSize));
  return ticketRequest<StaffQueueResponse>(`/api/staff/tickets?${parameters.toString()}`, "Unable to load the Ticket queue. Please retry.");
}

export async function fetchStaffAssignees(): Promise<Array<Pick<AuthUser, "id" | "displayName" | "role">>> {
  return ticketRequest("/api/staff/assignees", "Unable to load available assignees. Please retry.");
}

export async function claimTicket(ticketId: number, version: number): Promise<TicketDetail> {
  return ticketRequest(`/api/staff/tickets/${ticketId}/claim`, "Unable to claim the Ticket. Please retry.", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version }) });
}

export async function updateTicketOwner(ticketId: number, ownerId: number | null, version: number): Promise<TicketDetail> {
  return ticketRequest(`/api/staff/tickets/${ticketId}/owner`, "Unable to update the owner. Please retry.", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId, version }) });
}

export async function updateTicketPriority(ticketId: number, itPriority: RequestedPriority, version: number): Promise<TicketDetail> {
  return ticketRequest(`/api/staff/tickets/${ticketId}/priority`, "Unable to update IT Priority. Please retry.", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itPriority, version }) });
}

export async function updateTicketStatus(ticketId: number, currentStatus: Ticket["currentStatus"], version: number, reason?: string, resolutionSummary?: string): Promise<TicketDetail> {
  return ticketRequest(`/api/staff/tickets/${ticketId}/status`, "Unable to update the Ticket status. Please retry.", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentStatus, version, reason, resolutionSummary }) });
}

export async function uploadTicketAttachment(ticketId: number, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.set("file", file);
  return ticketRequest<Attachment>(`/api/tickets/${ticketId}/attachments`, "Unable to upload the attachment. Please retry.", {
    method: "POST",
    body: formData,
  });
}

export async function removeTicketAttachment(ticketId: number, attachmentId: number, reason: string): Promise<Attachment> {
  return ticketRequest<Attachment>(`/api/tickets/${ticketId}/attachments/${attachmentId}/remove`, "Unable to remove the attachment. Please retry.", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function downloadTicketAttachment(ticketId: number, attachmentId: number, filename: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      credentials: "same-origin",
    });
  } catch {
    throw new TicketApiError("Unable to download the attachment. Please retry.");
  }

  if (!response.ok) throw await apiError(response, "Unable to download the attachment. Please retry.");
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
    response = await fetch(path, { ...init, credentials: "same-origin", headers: { ...init?.headers, ...(init?.method && init.method !== "GET" ? csrfHeaders() : {}) } });
  } catch {
    throw new TicketApiError(fallbackMessage);
  }

  const payload = await response.json().catch(() => null) as { message?: unknown; fieldErrors?: unknown } | null;
  if (!response.ok) {
    throw errorFromPayload(response, payload, fallbackMessage);
  }
  return payload as T;
}

async function authRequest(path: string, init?: RequestInit): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers, ...(path.includes("change-password") ? csrfHeaders() : {}) },
    });
  } catch {
    throw new TicketApiError("Authentication is temporarily unavailable.");
  }
  if (!response.ok) throw await apiError(response, "Unable to complete authentication.");
  const session = await response.json() as AuthSession;
  csrfToken = session.csrfToken;
  return session;
}

async function apiError(response: Response, fallback: string): Promise<TicketApiError> {
  const payload = await response.json().catch(() => null) as { code?: unknown; message?: unknown; fieldErrors?: unknown } | null;
  return errorFromPayload(response, payload, fallback);
}

function errorFromPayload(
  response: Response,
  payload: { code?: unknown; message?: unknown; fieldErrors?: unknown } | null,
  fallback: string,
): TicketApiError {
  const fieldErrors = payload?.fieldErrors && typeof payload.fieldErrors === "object" && !Array.isArray(payload.fieldErrors)
    ? Object.fromEntries(Object.entries(payload.fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : undefined;
  const retryAfter = Number(response.headers?.get?.("Retry-After") ?? Number.NaN);
  const error = new TicketApiError(
    typeof payload?.message === "string" ? payload.message : fallback,
    fieldErrors,
    typeof payload?.code === "string" ? payload.code : undefined,
    response.status,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  );
  if (error.status === 401 && error.code === "UNAUTHENTICATED") {
    csrfToken = "";
    if (typeof window !== "undefined") window.dispatchEvent(new Event(sessionExpiredEvent));
  }
  return error;
}

function csrfHeaders(): Record<string, string> {
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}

async function fetchReferenceData<T>(path: string, errorMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, { credentials: "same-origin" });
  } catch {
    throw new Error(errorMessage);
  }

  if (!response.ok) throw await apiError(response, errorMessage);

  return response.json() as Promise<T>;
}
