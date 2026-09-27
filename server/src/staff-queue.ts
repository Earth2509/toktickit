import type { Prisma, RequestedPriority, TicketStatus } from "@prisma/client";

export const staffQueueSortFields = ["createdAt", "updatedAt", "ticketNumber", "itPriority", "currentStatus"] as const;
export const staffQueueSortOrders = ["asc", "desc"] as const;
export const staffQueuePageSizes = [10, 20, 50] as const;
export const staffQueuePriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const staffQueueStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"] as const;

type StaffQueueQuery = {
  search?: string; categoryId?: number; relatedSystemId?: number;
  requestedPriority?: RequestedPriority; itPriority?: RequestedPriority | RequestedPriority[]; currentStatus?: TicketStatus | TicketStatus[];
  ownerId?: number | "unassigned"; owner?: "me" | "unassigned"; actorId?: number; sortBy: (typeof staffQueueSortFields)[number];
  sortOrder: "asc" | "desc"; page: number; pageSize: 10 | 20 | 50;
};

export function validateStaffQueueQuery(query: Record<string, unknown>, actorId?: number): { value: StaffQueueQuery } | { fieldErrors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const allowed = new Set(["search", "categoryId", "relatedSystemId", "requestedPriority", "itPriority", "currentStatus", "ownerId", "owner", "sortBy", "sortOrder", "page", "pageSize"]);
  for (const key of Object.keys(query)) if (!allowed.has(key)) errors[key] = "This query parameter is not supported.";
  const one = (key: string) => Array.isArray(query[key]) ? (errors[key] = "Provide one value.", undefined) : query[key];
  const positive = (key: string) => { const raw = one(key); if (raw === undefined) return undefined; const n = Number(raw); if (!Number.isSafeInteger(n) || n < 1) { errors[key] = "Use a positive whole number."; return undefined; } return n; };
  const enumValue = <T extends readonly string[]>(key: string, values: T): T[number] | undefined => { const raw = one(key); if (raw === undefined) return undefined; if (typeof raw !== "string" || !values.includes(raw)) { errors[key] = `Choose one of: ${values.join(", ")}.`; return undefined; } return raw as T[number]; };
  const rawSearch = one("search");
  const search = rawSearch === undefined ? undefined : typeof rawSearch === "string" ? rawSearch.trim() : "";
  if (rawSearch !== undefined && (!search || search.length > 120)) errors.search = "Use 1 to 120 characters.";
  const rawOwner = one("ownerId");
  const ownerId = rawOwner === undefined ? undefined : rawOwner === "unassigned" ? "unassigned" : positive("ownerId");
  const owner = enumValue("owner", ["me", "unassigned"] as const);
  if (rawOwner !== undefined && query.owner !== undefined) errors.owner = "Choose owner or ownerId, not both.";
  if (owner === "me" && actorId === undefined) errors.owner = "A signed-in staff member is required.";
  const page = positive("page") ?? 1;
  const pageSizeRaw = positive("pageSize") ?? 10;
  if (!staffQueuePageSizes.includes(pageSizeRaw as 10 | 20 | 50)) errors.pageSize = "Choose 10, 20 or 50.";
  const sortBy = enumValue("sortBy", staffQueueSortFields) ?? "updatedAt";
  const sortOrder = enumValue("sortOrder", staffQueueSortOrders) ?? "desc";
  // Resolve every filter before deciding whether validation failed.  Keeping
  // these calls in the returned object would make them unreachable whenever
  // another field has already populated `errors`, silently dropping a bad
  // filter instead of returning the required 400 response.
  const categoryId = positive("categoryId");
  const relatedSystemId = positive("relatedSystemId");
  const requestedPriority = enumValue("requestedPriority", staffQueuePriorities) as RequestedPriority | undefined;
  const enumList = <T extends readonly string[]>(key: string, values: T): T[number] | T[number][] | undefined => {
    const raw = one(key);
    if (raw === undefined) return undefined;
    if (typeof raw !== "string") { errors[key] = `Choose one of: ${values.join(", ")}.`; return undefined; }
    const parts = raw.split(",");
    if (parts.some(part => !values.includes(part) || parts.indexOf(part) !== parts.lastIndexOf(part))) {
      errors[key] = `Choose one of: ${values.join(", ")}.`; return undefined;
    }
    return parts.length === 1 ? parts[0] as T[number] : parts as T[number][];
  };
  const itPriority = enumList("itPriority", staffQueuePriorities) as RequestedPriority | RequestedPriority[] | undefined;
  const currentStatus = enumList("currentStatus", staffQueueStatuses) as TicketStatus | TicketStatus[] | undefined;
  if (Object.keys(errors).length) return { fieldErrors: errors };
  return { value: { search, categoryId, relatedSystemId, requestedPriority, itPriority, currentStatus, ownerId, owner, actorId, sortBy, sortOrder, page, pageSize: pageSizeRaw as 10 | 20 | 50 } };
}

export function staffQueueWhere(query: StaffQueueQuery): Prisma.TicketWhereInput {
  return {
    ...(query.search ? { OR: [{ ticketNumber: { contains: query.search, mode: "insensitive" } }, { summary: { contains: query.search, mode: "insensitive" } }] } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}), ...(query.relatedSystemId ? { relatedSystemId: query.relatedSystemId } : {}),
    ...(query.requestedPriority ? { requestedPriority: query.requestedPriority } : {}), ...(query.itPriority ? { itPriority: Array.isArray(query.itPriority) ? { in: query.itPriority } : query.itPriority } : {}),
    ...(query.currentStatus ? { currentStatus: Array.isArray(query.currentStatus) ? { in: query.currentStatus } : query.currentStatus } : {}),
    ...(query.owner === "unassigned" || query.ownerId === "unassigned" ? { ownerId: null } : query.owner === "me" ? { ownerId: query.actorId } : query.ownerId ? { ownerId: query.ownerId } : {}),
  };
}

export function staffQueueOrderBy(query: StaffQueueQuery): Prisma.TicketOrderByWithRelationInput[] {
  return [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }];
}
