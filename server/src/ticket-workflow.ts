import type { TicketStatus } from "@prisma/client";

export const workflowStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"] as const satisfies readonly TicketStatus[];
export const terminalStatuses = new Set<TicketStatus>(["RESOLVED", "CLOSED", "CANCELLED"]);

export const allowedTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  CANCELLED: ["REOPENED"],
};

export type WorkflowValidation = { kind: "conflict" | "validation"; message: string };

export type ResolutionEvidence = {
  ownerActive: boolean;
  openActionCount: number;
  latestCompletedAction: { completedAt: Date | null; followUpRequired: boolean } | null;
  latestReopenedAt: Date | null;
};

export function resolutionGate(evidence: ResolutionEvidence): WorkflowValidation | undefined {
  if (!evidence.ownerActive) return { kind: "conflict", message: "Assign an active IT Staff member or Administrator before resolving this Ticket." };
  if (evidence.openActionCount > 0) return { kind: "conflict", message: "Complete or cancel every open Action Taken before resolving this Ticket." };
  const latest = evidence.latestCompletedAction;
  if (!latest?.completedAt) return { kind: "conflict", message: "Record a completed Action Taken before resolving this Ticket." };
  if (evidence.latestReopenedAt && latest.completedAt <= evidence.latestReopenedAt) {
    return { kind: "conflict", message: "Complete a new Action Taken after the latest reopening before resolving this Ticket." };
  }
  if (latest.followUpRequired) return { kind: "conflict", message: "Complete a later Action Taken with no follow-up required before resolving this Ticket." };
  return undefined;
}

export function workflowValidation(input: { from: TicketStatus; to: TicketStatus; ownerId: number | null; reason?: unknown; resolutionSummary?: unknown }): WorkflowValidation | undefined {
  if (!allowedTransitions[input.from].includes(input.to)) return { kind: "conflict", message: "This status transition is not permitted." };
  const needsActiveOwner = ["OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED"].includes(input.to);
  if (needsActiveOwner && !input.ownerId) return { kind: "conflict", message: "Assign an active owner before moving to this status." };
  if (["CANCELLED", "REOPENED"].includes(input.to) && !validReason(input.reason)) return { kind: "validation", message: "Provide a reason of 5 to 250 characters." };
  if (input.to === "RESOLVED" && !validResolution(input.resolutionSummary)) return { kind: "validation", message: "Provide a resolution summary of 5 to 2000 characters." };
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
