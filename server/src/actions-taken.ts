import type { ActionTakenStatus } from "@prisma/client";

export const actionTakenStatuses = ["OPEN", "COMPLETED", "CANCELLED"] as const satisfies readonly ActionTakenStatus[];
export const actionIdempotencyRetentionMilliseconds = 24 * 60 * 60 * 1000;

export type ActionTakenCreateInput = {
  actionAt: Date;
  description: string;
  result: string | null;
  assignedToId: number;
  status: ActionTakenStatus;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
};

export type ActionTakenPatchInput = {
  version: number;
  description?: string;
  result?: string | null;
  assignedToId?: number;
  status?: Exclude<ActionTakenStatus, "OPEN">;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
};

type ValidationResult<T> = { value: T } | { badRequest: string } | { validation: string };
const createKeys = ["actionAt", "description", "result", "assignedToId", "status", "followUpRequired", "followUpNote", "attachmentNotes"];
const patchKeys = ["version", "description", "result", "assignedToId", "status", "followUpRequired", "followUpNote", "attachmentNotes"];

export function parseActionTakenCreate(value: unknown, now = new Date()): ValidationResult<ActionTakenCreateInput> {
  if (!isRecord(value)) return { badRequest: "A JSON object is required." };
  if (!hasOnlyKnownKeys(value, createKeys)) return { badRequest: "The Action Taken body contains an unsupported field." };
  if (!("actionAt" in value) || !("description" in value) || !("assignedToId" in value) || !("followUpRequired" in value)) {
    return { validation: "Action time, description, assignee and follow-up requirement are required." };
  }
  const actionAt = parseActionAt(value.actionAt, now);
  const description = trimmed(value.description, 1, 2000);
  const assignedToId = positiveInteger(value.assignedToId);
  const status = value.status === undefined ? "OPEN" : parseStatus(value.status);
  if (!actionAt || !description || !assignedToId || !status || typeof value.followUpRequired !== "boolean") {
    return { validation: "One or more Action Taken fields are invalid." };
  }
  const result = nullableTrimmed(value.result, 2000);
  const followUpNote = nullableTrimmed(value.followUpNote, 1000);
  const attachmentNotes = nullableTrimmed(value.attachmentNotes, 1000);
  if (result === undefined || followUpNote === undefined || attachmentNotes === undefined) return { validation: "One or more Action Taken text fields are invalid." };
  const ruleFailure = validateActionValues({ status, result, followUpRequired: value.followUpRequired, followUpNote });
  if (ruleFailure) return { validation: ruleFailure };
  return { value: { actionAt, description, result, assignedToId, status, followUpRequired: value.followUpRequired, followUpNote: value.followUpRequired ? followUpNote : null, attachmentNotes } };
}

export function parseActionTakenPatch(value: unknown): ValidationResult<ActionTakenPatchInput> {
  if (!isRecord(value)) return { badRequest: "A JSON object is required." };
  if (!hasOnlyKnownKeys(value, patchKeys)) return { badRequest: "The Action Taken body contains an unsupported field." };
  const version = positiveInteger(value.version);
  if (!version) return { validation: "Action Taken version is required." };
  const editable = patchKeys.filter((key) => key !== "version" && key in value);
  if (editable.length === 0) return { validation: "Provide at least one Action Taken field to update." };
  const patch: ActionTakenPatchInput = { version };
  if ("description" in value) {
    const description = trimmed(value.description, 1, 2000);
    if (!description) return { validation: "Description must contain 1 to 2000 characters." };
    patch.description = description;
  }
  if ("result" in value) {
    const result = nullableTrimmed(value.result, 2000);
    if (result === undefined) return { validation: "Result must contain at most 2000 characters." };
    patch.result = result;
  }
  if ("assignedToId" in value) {
    const assignedToId = positiveInteger(value.assignedToId);
    if (!assignedToId) return { validation: "Choose an active IT Staff member or Administrator." };
    patch.assignedToId = assignedToId;
  }
  if ("status" in value) {
    if (value.status !== "COMPLETED" && value.status !== "CANCELLED") return { validation: "An OPEN Action can only transition to COMPLETED or CANCELLED." };
    patch.status = value.status;
  }
  if ("followUpRequired" in value) {
    if (typeof value.followUpRequired !== "boolean") return { validation: "Follow-up requirement must be true or false." };
    patch.followUpRequired = value.followUpRequired;
  }
  if ("followUpNote" in value) {
    const followUpNote = nullableTrimmed(value.followUpNote, 1000);
    if (followUpNote === undefined) return { validation: "Follow-up note must contain at most 1000 characters." };
    patch.followUpNote = followUpNote;
  }
  if ("attachmentNotes" in value) {
    const attachmentNotes = nullableTrimmed(value.attachmentNotes, 1000);
    if (attachmentNotes === undefined) return { validation: "Attachment notes must contain at most 1000 characters." };
    patch.attachmentNotes = attachmentNotes;
  }
  return { value: patch };
}

export function validateActionValues(value: { status: ActionTakenStatus; result: string | null; followUpRequired: boolean; followUpNote: string | null }): string | undefined {
  if (value.status === "OPEN" && value.result !== null) return "An OPEN Action cannot have a result.";
  if (value.status === "COMPLETED" && !value.result) return "A completed Action requires a result.";
  if (value.followUpRequired && !value.followUpNote) return "A follow-up note is required when follow-up is required.";
  return undefined;
}

export function actionTakenPagination(query: Record<string, unknown>): { page: number; pageSize: number } | undefined {
  if (!Object.keys(query).every((key) => key === "page" || key === "pageSize")) return undefined;
  const page = query.page === undefined ? 1 : parseQueryInteger(query.page);
  const pageSize = query.pageSize === undefined ? 10 : parseQueryInteger(query.pageSize);
  return page && pageSize && new Set([10, 20, 50]).has(pageSize) ? { page, pageSize } : undefined;
}

export function actionIdempotencyKey(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 200 ? value.trim() : undefined;
}

function parseActionAt(value: unknown, now: Date): Date | undefined {
  if (typeof value !== "string" || !value.endsWith("Z")) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || parsed.getTime() > now.getTime() + 5 * 60 * 1000 ? undefined : parsed;
}

function parseStatus(value: unknown): ActionTakenStatus | undefined {
  return typeof value === "string" && actionTakenStatuses.includes(value as ActionTakenStatus) ? value as ActionTakenStatus : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function trimmed(value: unknown, min: number, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result.length >= min && result.length <= max ? result : undefined;
}

function nullableTrimmed(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  return result.length <= max ? (result || null) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKnownKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function parseQueryInteger(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d+$/u.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
