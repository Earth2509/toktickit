import type { TicketStatus } from "@prisma/client";

export const workflowStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"] as const satisfies readonly TicketStatus[];
export const terminalStatuses = new Set<TicketStatus>(["RESOLVED", "CLOSED", "CANCELLED"]);

const allowedTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: ["REOPENED"],
};

export function workflowValidation(input: { from: TicketStatus; to: TicketStatus; ownerId: number | null; reason?: unknown; resolutionSummary?: unknown }): string | undefined {
  if (!allowedTransitions[input.from].includes(input.to)) return "This status transition is not permitted.";
  const needsActiveOwner = ["OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED"].includes(input.to);
  if (needsActiveOwner && !input.ownerId) return "Assign an active owner before moving to this status.";
  if (["CANCELLED", "REOPENED"].includes(input.to) && !validReason(input.reason)) return "Provide a reason of 5 to 250 characters.";
  if (input.to === "RESOLVED" && !validResolution(input.resolutionSummary)) return "Provide a resolution summary of 5 to 2000 characters.";
  return undefined;
}

export function editableOperationalFields(status: TicketStatus): boolean {
  return !terminalStatuses.has(status);
}

function validReason(value: unknown): boolean {
  return typeof value === "string" && value.trim().length >= 5 && value.trim().length <= 250;
}

function validResolution(value: unknown): boolean {
  return typeof value === "string" && value.trim().length >= 5 && value.trim().length <= 2000;
}
