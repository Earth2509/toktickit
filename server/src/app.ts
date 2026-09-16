import express from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";
import {
  isPermittedAttachment,
  maximumActiveAttachments,
  maximumAttachmentBytes,
  positiveAttachmentInteger,
  validateAttachmentRemoval,
} from "./attachments.js";
import { ticketListOrderBy, ticketListWhere, validateTicketListQuery } from "./ticket-query.js";
import { staffQueueOrderBy, staffQueueWhere, validateStaffQueueQuery } from "./staff-queue.js";
import { editableOperationalFields, workflowValidation } from "./ticket-workflow.js";
import { canCreateDiscussion, canIndicateResolution, discussionPagination, validateDiscussionContent } from "./ticket-discussions.js";
import { formatTicketNumber, matchesTicketCreate, validateTicketCreate } from "./tickets.js";
import {
  authenticatedUser,
  changePassword,
  currentUser,
  login,
  logout,
  requireAuthenticatedUser,
  requireCsrfToken,
  requirePasswordChangeComplete,
  requireRole,
  requireTrustedOrigin,
} from "./auth.js";

export const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maximumAttachmentBytes } });
const attachmentDirectory = path.resolve(process.env.ATTACHMENT_STORAGE_DIR ?? path.join(process.cwd(), "uploads"));
const attachmentSelect = {
  id: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  removedAt: true,
  removedByRequesterId: true,
  removalReason: true,
};
const ticketDetailInclude = {
  requester: { select: { id: true, displayName: true, email: true } },
  category: { select: { id: true, name: true } },
  relatedSystem: { select: { id: true, name: true } },
  attachments: { orderBy: { createdAt: "desc" as const }, select: attachmentSelect },
  owner: { select: { id: true, displayName: true, role: true, isActive: true } },
  requesterResolvedBy: { select: { id: true, displayName: true } },
};
const discussionEntrySelect = {
  id: true,
  ticketId: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, displayName: true, role: true } },
};
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "TokTickIT API" }));

// Authentication is established before every protected business route below.
app.post("/api/auth/login", requireTrustedOrigin, asyncHandler(login));
app.get("/api/auth/me", asyncHandler(requireAuthenticatedUser), asyncHandler(currentUser));
app.post(
  "/api/auth/change-password",
  requireTrustedOrigin,
  asyncHandler(requireAuthenticatedUser),
  requireCsrfToken,
  asyncHandler(changePassword),
);
app.post("/api/auth/logout", requireTrustedOrigin, asyncHandler(logout));

const protectedResource = [asyncHandler(requireAuthenticatedUser), requirePasswordChangeComplete];
// Resource authentication is already applied by the prefix middleware above.
// Mutation routes add only the browser-origin and session-bound CSRF checks.
const protectedMutation = [requireTrustedOrigin, requireCsrfToken];

app.use(["/api/categories", "/api/related-systems", "/api/tickets"], ...protectedResource);
// Queue reads are deliberately isolated from requester routes. Issue #40 has
// no mutation controls: ownership, priority and status changes arrive in #41.
app.use("/api/staff", ...protectedResource, requireRole("IT_STAFF", "ADMINISTRATOR"));

app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(503).json({ message: "Unable to load request categories" });
  }
});

app.get("/api/related-systems", async (_req, res) => {
  try {
    const relatedSystems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(relatedSystems);
  } catch {
    res.status(503).json({ message: "Unable to load related systems" });
  }
});

app.post("/api/tickets", ...protectedMutation, requireRole("REQUESTER"), async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "A JSON object is required." });
  }

  if ("requesterId" in req.body) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }

  const requesterId = authenticatedUser(res).id;
  const validation = validateTicketCreate({ ...req.body, requesterId });
  if (!validation.value) {
    return res.status(422).json({ message: "Ticket validation failed", fieldErrors: validation.fieldErrors });
  }

  const input = validation.value;
  const prisma = getPrisma();
  const ticketInclude = {
    category: { select: { id: true, name: true } },
    relatedSystem: { select: { id: true, name: true } },
  };

  try {
    const existingTicket = await prisma.ticket.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: ticketInclude,
    });

    if (existingTicket) {
      if (!matchesTicketCreate(existingTicket, input)) {
        return res.status(409).json({ message: "The idempotency key was already used with different Ticket data." });
      }

      return res.status(200).json(existingTicket);
    }

    const [requester, category, relatedSystem] = await Promise.all([
      prisma.user.findFirst({ where: { id: requesterId, isActive: true, role: "REQUESTER" }, select: { id: true } }),
      prisma.category.findFirst({ where: { id: input.categoryId, isActive: true }, select: { id: true } }),
      prisma.relatedSystem.findFirst({ where: { id: input.relatedSystemId, isActive: true }, select: { id: true } }),
    ]);

    if (!requester || !category || !relatedSystem) {
      return res.status(404).json({ message: "Requester or reference data is unavailable." });
    }

    const createdTicket = await prisma.$transaction(async (transaction) => {
      const created = await transaction.ticket.create({
        data: {
          ...input,
          ticketNumber: `PENDING-${randomUUID()}`,
          currentStatus: "NEW",
          itPriority: input.requestedPriority,
        },
        select: { id: true, createdAt: true },
      });

      return transaction.ticket.update({
        where: { id: created.id },
        data: { ticketNumber: formatTicketNumber(created.id, created.createdAt) },
        include: ticketInclude,
      });
    });

    return res.status(201).json(createdTicket);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existingTicket = await prisma.ticket.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: ticketInclude,
      });

      if (existingTicket && matchesTicketCreate(existingTicket, input)) {
        return res.status(200).json(existingTicket);
      }

      return res.status(409).json({ message: "The idempotency key was already used with different Ticket data." });
    }

    if (isDependencyUnavailable(error)) {
      return res.status(503).json({ message: "Ticket service is temporarily unavailable." });
    }

    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unable to complete the request" });
  }
});

app.get("/api/tickets", requireRole("REQUESTER"), async (req, res) => {
  if ("requesterId" in req.query) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  const requesterId = authenticatedUser(res).id;
  const validation = validateTicketListQuery({ ...req.query, requesterId: String(requesterId) });
  if (!validation.value) {
    return res.status(400).json({ message: "Ticket list query validation failed", fieldErrors: validation.fieldErrors });
  }

  const query = validation.value;
  const prisma = getPrisma();

  try {
    const where = ticketListWhere(query);
    const [totalItems, items] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: ticketListOrderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          ticketNumber: true,
          requesterId: true,
          categoryId: true,
          relatedSystemId: true,
          summary: true,
          requestedPriority: true,
          currentStatus: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      }),
    ]);

    return res.status(200).json({
      items,
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
    });
  } catch (error) {
    if (isDependencyUnavailable(error)) {
      return res.status(503).json({ message: "Ticket service is temporarily unavailable." });
    }

    return res.status(500).json({ message: "Unable to load Tickets" });
  }
});

app.get("/api/tickets/:ticketId", async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  if ("requesterId" in req.query) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  if (!ticketId) {
    return res.status(400).json({ message: "Ticket identifier must be a positive whole number." });
  }

  try {
    const user = authenticatedUser(res);
    const ticket = await getPrisma().ticket.findFirst({
      where: user.role === "REQUESTER" ? { id: ticketId, requesterId: user.id } : { id: ticketId },
      include: ticketDetailInclude,
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    return res.status(200).json(ticket);
  } catch (error) {
    return attachmentFailure(res, error, "Unable to load the Ticket.");
  }
});

app.get("/api/tickets/:ticketId/attachments", async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  if ("requesterId" in req.query) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  if (!ticketId) {
    return res.status(400).json({ message: "Ticket identifier must be a positive whole number." });
  }

  try {
    const user = authenticatedUser(res);
    const ownedTicket = await getPrisma().ticket.findFirst({ where: user.role === "REQUESTER" ? { id: ticketId, requesterId: user.id } : { id: ticketId }, select: { id: true } });
    if (!ownedTicket) return res.status(404).json({ message: "Ticket not found." });

    const attachments = await getPrisma().attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      select: attachmentSelect,
    });
    return res.status(200).json(attachments);
  } catch (error) {
    return attachmentFailure(res, error, "Unable to load attachments.");
  }
});

app.post("/api/tickets/:ticketId/attachments", ...protectedMutation, requireRole("REQUESTER"), upload.single("file"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  if (req.body && "requesterId" in req.body) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  const requesterId = authenticatedUser(res).id;
  if (!ticketId || !req.file) {
    return res.status(400).json({ message: "An owned Ticket and one attachment file are required." });
  }

  const validation = isPermittedAttachment(req.file);
  if (!validation.valid) return res.status(validation.status).json({ message: validation.message });

  const prisma = getPrisma();
  try {
    const ownedTicket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterId }, select: { id: true, currentStatus: true } });
    if (!ownedTicket) return res.status(404).json({ message: "Ticket not found." });
    if (["CLOSED", "CANCELLED"].includes(ownedTicket.currentStatus)) {
      return res.status(409).json({ code: "CONFLICT", message: "Attachments cannot be uploaded in this Ticket status." });
    }

    const storageKey = randomUUID();
    const storagePath = path.join(attachmentDirectory, storageKey);
    await mkdir(attachmentDirectory, { recursive: true });
    await writeFile(storagePath, req.file.buffer, { flag: "wx" });

    try {
      const attachment = await createAttachmentInAvailableSlot(prisma, {
        ticketId,
        storageKey,
        originalFilename: safeFilename(req.file.originalname),
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      });
      return res.status(201).json(attachment);
    } catch (error) {
      await unlink(storagePath).catch(() => undefined);
      if (error instanceof ActiveAttachmentLimitError) {
        return res.status(409).json({ message: "A Ticket can have no more than five active attachments." });
      }
      throw error;
    }
  } catch (error) {
    return attachmentFailure(res, error, "Unable to store the attachment.");
  }
});

app.get("/api/tickets/:ticketId/attachments/:attachmentId/download", async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const attachmentId = requestId(req.params.attachmentId);
  if ("requesterId" in req.query) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  if (!ticketId || !attachmentId) {
    return res.status(400).json({ message: "Ticket and attachment identifiers must be positive whole numbers." });
  }

  try {
    const user = authenticatedUser(res);
    const attachment = await getPrisma().attachment.findFirst({
      where: { id: attachmentId, ticketId, removedAt: null, ...(user.role === "REQUESTER" ? { ticket: { requesterId: user.id } } : {}) },
      select: { storageKey: true, originalFilename: true, mimeType: true },
    });
    if (!attachment) return res.status(404).json({ message: "Attachment not found." });

    const file = await readFile(path.join(attachmentDirectory, attachment.storageKey));
    res.status(200);
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalFilename)}`);
    return res.send(file);
  } catch (error) {
    return attachmentFailure(res, error, "Unable to download the attachment.");
  }
});

app.patch("/api/tickets/:ticketId/attachments/:attachmentId/remove", ...protectedMutation, requireRole("REQUESTER"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const attachmentId = requestId(req.params.attachmentId);
  if (req.body && typeof req.body === "object" && "requesterId" in req.body) {
    return res.status(400).json({ code: "LEGACY_IDENTITY_UNSUPPORTED", message: "Requester identity comes from the authenticated session." });
  }
  const requesterId = authenticatedUser(res).id;
  const validation = validateAttachmentRemoval({ ...req.body, requesterId });
  if (!ticketId || !attachmentId) {
    return res.status(400).json({ message: "Ticket and attachment identifiers must be positive whole numbers." });
  }
  if (!validation.value) {
    return res.status(422).json({ message: "Attachment removal validation failed", fieldErrors: validation.fieldErrors });
  }

  const { reason } = validation.value;
  try {
    const attachment = await getPrisma().attachment.findFirst({
      where: { id: attachmentId, ticketId, ticket: { requesterId } },
      select: { id: true, removedAt: true, ticket: { select: { currentStatus: true } } },
    });
    if (!attachment) return res.status(404).json({ message: "Attachment not found." });
    if (attachment.removedAt) return res.status(409).json({ message: "This attachment has already been removed." });
    if (["CLOSED", "CANCELLED"].includes(attachment.ticket.currentStatus)) {
      return res.status(409).json({ code: "CONFLICT", message: "Attachments cannot be removed in this Ticket status." });
    }

    const removedAttachment = await getPrisma().attachment.update({
      where: { id: attachment.id },
      data: { activeSlot: null, removedAt: new Date(), removedByRequesterId: requesterId, removalReason: reason },
      select: attachmentSelect,
    });
    return res.status(200).json(removedAttachment);
  } catch (error) {
    return attachmentFailure(res, error, "Unable to remove the attachment.");
  }
});

// Keep normal routes before the terminal error handler so future route work is
// not visually mistaken for unreachable middleware.
app.get("/api/staff/tickets", async (req, res) => {
  const validation = validateStaffQueueQuery(req.query);
  if (!("value" in validation)) {
    return res.status(400).json({ message: "Staff queue query validation failed", fieldErrors: validation.fieldErrors });
  }

  const query = validation.value;
  try {
    const where = staffQueueWhere(query);
    const [totalItems, items] = await Promise.all([
      getPrisma().ticket.count({ where }),
      getPrisma().ticket.findMany({
        where,
        orderBy: staffQueueOrderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true, ticketNumber: true, summary: true, requestedPriority: true, itPriority: true,
          currentStatus: true, createdAt: true, updatedAt: true,
          requesterResolvedAt: true,
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, displayName: true } },
          owner: { select: { id: true, displayName: true, role: true } },
        },
      }),
    ]);
    return res.status(200).json({
      items, page: query.page, pageSize: query.pageSize, totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
    });
  } catch (error) {
    if (isDependencyUnavailable(error)) return res.status(503).json({ message: "Ticket queue is temporarily unavailable." });
    return res.status(500).json({ message: "Unable to load the Ticket queue." });
  }
});

// Discussion data is intentionally stored in separate tables. Requester ticket
// scopes are applied before comments are queried; internal notes are role-gated
// before their ticket lookup so they cannot become a requester side channel.
app.get("/api/tickets/:ticketId/comments", async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const pagination = discussionPagination(req.query);
  if (!ticketId || !pagination) return res.status(400).json({ message: "Ticket id, page or page size is invalid." });
  const user = authenticatedUser(res);
  const ticket = await getPrisma().ticket.findFirst({ where: user.role === "REQUESTER" ? { id: ticketId, requesterId: user.id } : { id: ticketId }, select: { id: true } });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  const where = { ticketId };
  const [totalItems, items] = await Promise.all([
    getPrisma().publicComment.count({ where }),
    getPrisma().publicComment.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize, select: discussionEntrySelect }),
  ]);
  return res.status(200).json({ items, ...pagination, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pagination.pageSize)) });
});

app.post("/api/tickets/:ticketId/comments", ...protectedMutation, async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const content = validateDiscussionContent(req.body?.content);
  if (!ticketId || !content || !onlyContent(req.body)) return res.status(422).json({ code: "VALIDATION_FAILED", message: "Comment content must contain 1 to 2000 non-whitespace characters." });
  const user = authenticatedUser(res);
  const ticket = await getPrisma().ticket.findFirst({ where: user.role === "REQUESTER" ? { id: ticketId, requesterId: user.id } : { id: ticketId }, select: { id: true, currentStatus: true } });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  if (!canCreateDiscussion(ticket.currentStatus)) return res.status(409).json({ code: "CONFLICT", message: "Comments cannot be created in this Ticket status." });
  const entry = await getPrisma().publicComment.create({ data: { ticketId, authorId: user.id, content }, select: discussionEntrySelect });
  return res.status(201).json(entry);
});

app.get("/api/tickets/:ticketId/internal-notes", requireRole("IT_STAFF", "ADMINISTRATOR"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const pagination = discussionPagination(req.query);
  if (!ticketId || !pagination) return res.status(400).json({ message: "Ticket id, page or page size is invalid." });
  const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  const where = { ticketId };
  const [totalItems, items] = await Promise.all([
    getPrisma().internalNote.count({ where }),
    getPrisma().internalNote.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize, select: discussionEntrySelect }),
  ]);
  return res.status(200).json({ items, ...pagination, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pagination.pageSize)) });
});

app.post("/api/tickets/:ticketId/internal-notes", ...protectedMutation, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const content = validateDiscussionContent(req.body?.content);
  if (!ticketId || !content || !onlyContent(req.body)) return res.status(422).json({ code: "VALIDATION_FAILED", message: "Note content must contain 1 to 2000 non-whitespace characters." });
  const ticket = await getPrisma().ticket.findUnique({ where: { id: ticketId }, select: { id: true, currentStatus: true } });
  if (!ticket) return res.status(404).json({ message: "Ticket not found." });
  if (!canCreateDiscussion(ticket.currentStatus)) return res.status(409).json({ code: "CONFLICT", message: "Internal notes cannot be created in this Ticket status." });
  const entry = await getPrisma().internalNote.create({ data: { ticketId, authorId: authenticatedUser(res).id, content }, select: discussionEntrySelect });
  return res.status(201).json(entry);
});

app.post("/api/tickets/:ticketId/resolution-indication", ...protectedMutation, requireRole("REQUESTER"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const version = workflowVersion(req.body?.version);
  if (!ticketId || version === undefined || !onlyVersion(req.body)) return res.status(422).json({ code: "VALIDATION_FAILED", message: "Ticket id and version are required." });
  const user = authenticatedUser(res);
  const result = await getPrisma().$transaction(async (transaction) => {
    const ticket = await transaction.ticket.findFirst({ where: { id: ticketId, requesterId: user.id }, select: { id: true, version: true, currentStatus: true, requesterResolvedAt: true, requesterResolvedById: true } });
    if (!ticket) return { kind: "missing" as const };
    if (!canIndicateResolution(ticket.currentStatus)) return { kind: "conflict" as const, message: "A resolution indication is not allowed in this Ticket status." };
    if (ticket.requesterResolvedAt) return { kind: "updated" as const, at: ticket.requesterResolvedAt, version: ticket.version };
    if (ticket.version !== version) return { kind: "conflict" as const, message: "This Ticket changed. Reload it before trying again." };
    const at = new Date();
    const write = await transaction.ticket.updateMany({ where: { id: ticketId, requesterId: user.id, version }, data: { requesterResolvedAt: at, requesterResolvedById: user.id, version: { increment: 1 } } });
    if (write.count !== 1) return { kind: "conflict" as const, message: "This Ticket changed. Reload it before trying again." };
    await transaction.ticketEvent.create({ data: { ticketId, actorId: user.id, type: "REQUESTER_RESOLUTION_INDICATED", before: ticket, after: { requesterResolvedAt: at } } });
    return { kind: "updated" as const, at, version: version + 1 };
  });
  if (result.kind === "missing") return res.status(404).json({ message: "Ticket not found." });
  if (result.kind === "conflict") return res.status(409).json({ code: "CONFLICT", message: result.message });
  return res.status(200).json({ requesterResolvedAt: result.at.toISOString(), version: result.version });
});

app.get("/api/staff/assignees", async (_req, res) => {
  try {
    return res.status(200).json(await getPrisma().user.findMany({
      where: { isActive: true, role: { in: ["IT_STAFF", "ADMINISTRATOR"] } },
      orderBy: [{ displayName: "asc" }, { id: "asc" }],
      select: { id: true, displayName: true, role: true },
    }));
  } catch (error) {
    if (isDependencyUnavailable(error)) return res.status(503).json({ message: "Assignees are temporarily unavailable." });
    return res.status(500).json({ message: "Unable to load assignees." });
  }
});

app.post("/api/staff/tickets/:id/claim", ...protectedMutation, async (req, res) => {
  const version = workflowVersion(req.body?.version);
  const ticketId = requestId(req.params.id);
  if (!ticketId || version === undefined) return res.status(422).json({ message: "Ticket id and version are required." });
  const actor = authenticatedUser(res);
  const result = await mutateWorkflow(ticketId, version, actor.id, "CLAIM", async (ticket) => {
    if (ticket.ownerId !== null) return { conflict: "This Ticket is already assigned." };
    if (!editableOperationalFields(ticket.currentStatus)) return { conflict: "Ownership cannot be changed in this Ticket status." };
    return { data: { ownerId: actor.id } };
  });
  return workflowResponse(res, result);
});

app.patch("/api/staff/tickets/:id/owner", ...protectedMutation, async (req, res) => {
  const version = workflowVersion(req.body?.version);
  const ticketId = requestId(req.params.id);
  const ownerId = req.body?.ownerId;
  if (!ticketId || version === undefined || !(ownerId === null || (Number.isSafeInteger(ownerId) && ownerId > 0))) return res.status(422).json({ message: "Ticket id, owner and version are required." });
  const actor = authenticatedUser(res);
  if (ownerId !== null) {
    const assignee = await getPrisma().user.findFirst({ where: { id: ownerId, isActive: true, role: { in: ["IT_STAFF", "ADMINISTRATOR"] } }, select: { id: true } });
    if (!assignee) return res.status(422).json({ message: "Choose an active IT Staff member or Administrator." });
  }
  const result = await mutateWorkflow(ticketId, version, actor.id, "OWNER_CHANGED", async (ticket) => {
    if (!editableOperationalFields(ticket.currentStatus)) return { conflict: "Ownership cannot be changed in this Ticket status." };
    if (ownerId === null && ticket.currentStatus !== "NEW" && ticket.currentStatus !== "REOPENED") return { conflict: "Active-work Tickets cannot be manually unassigned." };
    return { data: { ownerId } };
  });
  return workflowResponse(res, result);
});

app.patch("/api/staff/tickets/:id/priority", ...protectedMutation, async (req, res) => {
  const version = workflowVersion(req.body?.version);
  const ticketId = requestId(req.params.id);
  const itPriority = req.body?.itPriority;
  if (!ticketId || version === undefined || !["LOW", "MEDIUM", "HIGH", "URGENT"].includes(itPriority)) return res.status(422).json({ message: "Ticket id, IT priority and version are required." });
  const result = await mutateWorkflow(ticketId, version, authenticatedUser(res).id, "IT_PRIORITY_CHANGED", async (ticket) => {
    if (!editableOperationalFields(ticket.currentStatus)) return { conflict: "IT Priority cannot be changed in this Ticket status." };
    return { data: { itPriority } };
  });
  return workflowResponse(res, result);
});

app.patch("/api/staff/tickets/:id/status", ...protectedMutation, async (req, res) => {
  const version = workflowVersion(req.body?.version);
  const ticketId = requestId(req.params.id);
  const currentStatus = req.body?.currentStatus;
  if (!ticketId || version === undefined || !["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"].includes(currentStatus)) return res.status(422).json({ message: "Ticket id, status and version are required." });
  const result = await mutateWorkflow(ticketId, version, authenticatedUser(res).id, "STATUS_CHANGED", async (ticket, transaction) => {
    const validation = workflowValidation({ from: ticket.currentStatus, to: currentStatus, ownerId: ticket.ownerId, reason: req.body?.reason, resolutionSummary: req.body?.resolutionSummary });
    if (validation) return validation.kind === "validation" ? { validation: validation.message } : { conflict: validation.message };

    const data: Record<string, unknown> = { currentStatus, ...(currentStatus === "RESOLVED" ? { resolutionSummary: req.body.resolutionSummary.trim() } : {}) };
    // A reopened Ticket must not retain an owner who can no longer work on it.
    // Check and clear this in the same transaction as the versioned status write.
    if (currentStatus === "REOPENED") {
      // The history event retains the previous indication, but a reopened
      // ticket must not display it as the current requester signal.
      data.requesterResolvedAt = null;
      data.requesterResolvedById = null;
    }
    if (currentStatus === "REOPENED" && ticket.ownerId !== null) {
      const eligibleOwner = await transaction.user.findFirst({
        where: { id: ticket.ownerId, isActive: true, role: { in: ["IT_STAFF", "ADMINISTRATOR"] } },
        select: { id: true },
      });
      if (!eligibleOwner) data.ownerId = null;
    }
    return { data };
  }, req.body?.reason);
  return workflowResponse(res, result);
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON body." });
  }

  if (statusCode(error) === 413) {
    return res.status(413).json({ message: "Request payload is too large." });
  }

  if (isMulterFileLimitError(error)) {
    return res.status(413).json({ message: "Each attachment must be 5 MB or smaller." });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: "The attachment upload could not be processed." });
  }

  return res.status(500).json({ code: "INTERNAL_ERROR", message: "Unable to complete the request" });
});

type WorkflowTicket = { id: number; version: number; ownerId: number | null; currentStatus: import("@prisma/client").TicketStatus; itPriority: import("@prisma/client").RequestedPriority };
type WorkflowMutation = { data: Record<string, unknown> } | { conflict: string } | { validation: string };

async function mutateWorkflow(
  ticketId: number,
  version: number,
  actorId: number,
  type: string,
  decide: (ticket: WorkflowTicket, transaction: Prisma.TransactionClient) => Promise<WorkflowMutation>,
  reason?: unknown,
) {
  return getPrisma().$transaction(async (transaction) => {
    const ticket = await transaction.ticket.findUnique({ where: { id: ticketId }, select: { id: true, version: true, ownerId: true, currentStatus: true, itPriority: true } });
    if (!ticket) return { kind: "missing" as const };
    if (ticket.version !== version) return { kind: "conflict" as const, message: "This Ticket changed. Reload it before trying again." };
    const decision = await decide(ticket, transaction);
    if ("conflict" in decision) return { kind: "conflict" as const, message: decision.conflict };
    if ("validation" in decision) return { kind: "validation" as const, message: decision.validation };
    // Compare the version in the update itself: two staff actions that read the
    // same version cannot both succeed between the read and write.
    const write = await transaction.ticket.updateMany({ where: { id: ticketId, version }, data: { ...decision.data, version: { increment: 1 } } });
    if (write.count !== 1) return { kind: "conflict" as const, message: "This Ticket changed. Reload it before trying again." };
    const updated = await transaction.ticket.findUniqueOrThrow({ where: { id: ticketId }, select: { id: true, ticketNumber: true, ownerId: true, itPriority: true, currentStatus: true, version: true, resolutionSummary: true, updatedAt: true } });
    await transaction.ticketEvent.create({ data: { ticketId, actorId, type, before: ticket, after: updated, reason: typeof reason === "string" ? reason.trim() : null } });
    return { kind: "updated" as const, ticket: updated };
  });
}

function workflowResponse(res: express.Response, result: Awaited<ReturnType<typeof mutateWorkflow>>) {
  if (result.kind === "missing") return res.status(404).json({ message: "Ticket not found." });
  if (result.kind === "conflict") return res.status(409).json({ code: "CONFLICT", message: result.message });
  if (result.kind === "validation") return res.status(422).json({ code: "VALIDATION_FAILED", message: result.message });
  return res.status(200).json(result.ticket);
}

function workflowVersion(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function onlyContent(value: unknown): value is { content: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 1 && "content" in value;
}

function onlyVersion(value: unknown): value is { version: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 1 && "version" in value;
}

function isUniqueConstraintError(error: unknown): boolean {
  return errorCode(error) === "P2002";
}

function asyncHandler(handler: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function isDependencyUnavailable(error: unknown): boolean {
  const code = errorCode(error);
  return code !== undefined && ["P1000", "P1001", "P1002", "P1008", "P1009", "P1017"].includes(code);
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function statusCode(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : undefined;
}

function requestId(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return positiveAttachmentInteger(parsed);
}

function safeFilename(value: string): string {
  const filename = path.basename(value).replace(/[\u0000-\u001f<>:"/\\|?*]+/g, " ").trim();
  return filename.slice(0, 180) || "attachment";
}

class ActiveAttachmentLimitError extends Error {}

async function createAttachmentInAvailableSlot(
  prisma: ReturnType<typeof getPrisma>,
  data: { ticketId: number; storageKey: string; originalFilename: string; mimeType: string; sizeBytes: number },
) {
  for (let attempt = 0; attempt < maximumActiveAttachments; attempt += 1) {
    const activeAttachments = await prisma.attachment.findMany({
      where: { ticketId: data.ticketId, removedAt: null },
      select: { activeSlot: true },
    });
    const activeSlots = new Set(activeAttachments.flatMap((attachment) => attachment.activeSlot === null ? [] : [attachment.activeSlot]));
    const activeSlot = firstAvailableAttachmentSlot(activeSlots);
    if (!activeSlot) throw new ActiveAttachmentLimitError();

    try {
      return await prisma.attachment.create({
        data: { ...data, activeSlot },
        select: attachmentSelect,
      });
    } catch (error) {
      if (isActiveAttachmentSlotConflict(error)) continue;
      throw error;
    }
  }

  throw new ActiveAttachmentLimitError();
}

function firstAvailableAttachmentSlot(activeSlots: Set<number>): number | undefined {
  for (let slot = 1; slot <= maximumActiveAttachments; slot += 1) {
    if (!activeSlots.has(slot)) return slot;
  }
  return undefined;
}

function attachmentFailure(res: express.Response, error: unknown, fallback: string) {
  if (isDependencyUnavailable(error)) return res.status(503).json({ message: fallback });
  return res.status(500).json({ message: fallback });
}

function isActiveAttachmentSlotConflict(error: unknown): boolean {
  if (!isUniqueConstraintError(error)) return false;
  const target = uniqueConstraintTarget(error);
  if (Array.isArray(target)) return target.includes("ticketId") && target.includes("activeSlot");
  return typeof target === "string" && target.includes("Attachment_active_ticket_slot_key");
}

function uniqueConstraintTarget(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("meta" in error)) return undefined;
  const meta = error.meta;
  return typeof meta === "object" && meta !== null && "target" in meta ? meta.target : undefined;
}

function isMulterFileLimitError(error: unknown): boolean {
  return error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
}

export default app;
