const terminalDiscussionStatuses = new Set(["CLOSED", "CANCELLED"]);
const indicationEligibleStatuses = new Set(["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"]);
const pageSizes = new Set([10, 20, 50]);

export function validateDiscussionContent(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const content = value.trim();
  return content.length >= 1 && content.length <= 2000 ? content : undefined;
}

export function discussionPagination(query: Record<string, unknown>) {
  // A misspelled query parameter must not quietly turn into the default page.
  // The queue endpoint follows the same rule, and it prevents clients from
  // believing their requested pagination was applied when it was not.
  if (!Object.keys(query).every((key) => key === "page" || key === "pageSize")) return undefined;
  const page = parsePositive(query.page) ?? 1;
  const pageSize = parsePositive(query.pageSize) ?? 10;
  return page > 0 && pageSizes.has(pageSize) ? { page, pageSize } : undefined;
}

export function canCreateDiscussion(status: string) {
  return !terminalDiscussionStatuses.has(status);
}

export function canIndicateResolution(status: string) {
  return indicationEligibleStatuses.has(status);
}

function parsePositive(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/u.test(value)) return 0;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 0;
}
