import type { Prisma, RequestedPriority, TicketStatus } from "@prisma/client";

export const ticketSortFields = ["createdAt", "updatedAt", "ticketNumber", "requestedPriority"] as const;
export const ticketSortOrders = ["asc", "desc"] as const;
export const ticketPageSizes = [10, 20, 50] as const;
export const ticketPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ticketStatuses = ["NEW"] as const;

export type TicketListQuery = {
  requesterId: number;
  search?: string;
  categoryId?: number;
  relatedSystemId?: number;
  requestedPriority?: RequestedPriority;
  currentStatus?: TicketStatus;
  sortBy: (typeof ticketSortFields)[number];
  sortOrder: (typeof ticketSortOrders)[number];
  page: number;
  pageSize: (typeof ticketPageSizes)[number];
};

export type TicketListQueryValidation =
  | { value: TicketListQuery; fieldErrors?: never }
  | { value?: never; fieldErrors: Record<string, string> };

type QueryValue = unknown;

export function validateTicketListQuery(query: Record<string, QueryValue>): TicketListQueryValidation {
  const fieldErrors: Record<string, string> = {};
  const requesterId = positiveInteger(query.requesterId, "requesterId", fieldErrors, true);
  const categoryId = positiveInteger(query.categoryId, "categoryId", fieldErrors, false);
  const relatedSystemId = positiveInteger(query.relatedSystemId, "relatedSystemId", fieldErrors, false);
  const search = optionalSearch(query.search, fieldErrors);
  const requestedPriority = optionalEnum(query.requestedPriority, "requestedPriority", ticketPriorities, fieldErrors) as RequestedPriority | undefined;
  const currentStatus = optionalEnum(query.currentStatus, "currentStatus", ticketStatuses, fieldErrors) as TicketStatus | undefined;
  const sortBy = optionalEnum(query.sortBy, "sortBy", ticketSortFields, fieldErrors) ?? "createdAt";
  const sortOrder = optionalEnum(query.sortOrder, "sortOrder", ticketSortOrders, fieldErrors) ?? "desc";
  const page = positiveInteger(query.page, "page", fieldErrors, false) ?? 1;
  const pageSize = optionalPageSize(query.pageSize, fieldErrors) ?? 10;

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    value: {
      requesterId: requesterId!,
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(relatedSystemId ? { relatedSystemId } : {}),
      ...(requestedPriority ? { requestedPriority } : {}),
      ...(currentStatus ? { currentStatus } : {}),
      sortBy: sortBy as TicketListQuery["sortBy"],
      sortOrder: sortOrder as TicketListQuery["sortOrder"],
      page,
      pageSize,
    },
  };
}

export function ticketListWhere(query: TicketListQuery): Prisma.TicketWhereInput {
  return {
    requesterId: query.requesterId,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.relatedSystemId ? { relatedSystemId: query.relatedSystemId } : {}),
    ...(query.requestedPriority ? { requestedPriority: query.requestedPriority } : {}),
    ...(query.currentStatus ? { currentStatus: query.currentStatus } : {}),
    ...(query.search
      ? {
          OR: [
            { ticketNumber: { contains: query.search, mode: "insensitive" } },
            { summary: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function ticketListOrderBy(query: TicketListQuery): Prisma.TicketOrderByWithRelationInput[] {
  if (query.sortBy === "createdAt") {
    return [{ createdAt: query.sortOrder }, { id: query.sortOrder }];
  }

  // PostgreSQL preserves the native RequestedPriority enum declaration order:
  // LOW, MEDIUM, HIGH, URGENT. Ordering by that field therefore follows the
  // documented severity sequence instead of alphabetical text ordering.
  return [{ [query.sortBy]: query.sortOrder }, { id: query.sortOrder }];
}

function positiveInteger(
  value: QueryValue,
  field: string,
  fieldErrors: Record<string, string>,
  required: boolean,
): number | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    fieldErrors[field] = "Provide a positive whole number.";
    return undefined;
  }

  return Number(value);
}

function optionalSearch(value: QueryValue, fieldErrors: Record<string, string>): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    fieldErrors.search = "Provide a single search value.";
    return undefined;
  }

  const search = value.trim();
  if (search.length === 0) return undefined;
  if (search.length > 120) {
    fieldErrors.search = "Enter at most 120 characters.";
    return undefined;
  }

  return search;
}

function optionalEnum<T extends readonly string[]>(
  value: QueryValue,
  field: string,
  allowed: T,
  fieldErrors: Record<string, string>,
): T[number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !allowed.includes(value)) {
    fieldErrors[field] = `Choose one of: ${allowed.join(", ")}.`;
    return undefined;
  }

  return value as T[number];
}

function optionalPageSize(value: QueryValue, fieldErrors: Record<string, string>): (typeof ticketPageSizes)[number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value) || !ticketPageSizes.includes(Number(value) as (typeof ticketPageSizes)[number])) {
    fieldErrors.pageSize = "Choose 10, 20, or 50.";
    return undefined;
  }

  return Number(value) as (typeof ticketPageSizes)[number];
}
