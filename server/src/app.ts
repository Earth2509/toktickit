import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { getPrisma } from "./prisma.js";
import {
  isPermittedAttachment,
  maximumActiveAttachments,
  maximumAttachmentBytes,
  positiveAttachmentInteger,
  validateAttachmentRemoval,
} from "./attachments.js";
import { ticketListOrderBy, ticketListWhere, validateTicketListQuery } from "./ticket-query.js";
import { formatTicketNumber, matchesTicketCreate, validateTicketCreate } from "./tickets.js";

export const app = express();
app.use(cors());
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
};
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "TokTickIT API" }));

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

app.get("/api/requesters", async (_req, res) => {
  try {
    const requesters = await getPrisma().requester.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, email: true },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(503).json({ message: "Unable to load Development Requesters" });
  }
});

app.post("/api/tickets", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "A JSON object is required." });
  }

  const validation = validateTicketCreate(req.body);
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
      prisma.requester.findFirst({ where: { id: input.requesterId, isActive: true }, select: { id: true } }),
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

    return res.status(500).json({ message: "Unable to complete the request" });
  }
});

app.get("/api/tickets", async (req, res) => {
  const validation = validateTicketListQuery(req.query);
  if (!validation.value) {
    return res.status(400).json({ message: "Ticket list query validation failed", fieldErrors: validation.fieldErrors });
  }

  const query = validation.value;
  const prisma = getPrisma();

  try {
    const requester = await prisma.requester.findFirst({
      where: { id: query.requesterId, isActive: true },
      select: { id: true },
    });

    if (!requester) {
      return res.status(404).json({ message: "Requester is unavailable." });
    }

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
  const requesterId = requestId(req.query.requesterId);
  if (!ticketId || !requesterId) {
    return res.status(400).json({ message: "Ticket and requester identifiers must be positive whole numbers." });
  }

  try {
    const ticket = await getPrisma().ticket.findFirst({
      where: { id: ticketId, requesterId },
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
  const requesterId = requestId(req.query.requesterId);
  if (!ticketId || !requesterId) {
    return res.status(400).json({ message: "Ticket and requester identifiers must be positive whole numbers." });
  }

  try {
    const ownedTicket = await getPrisma().ticket.findFirst({ where: { id: ticketId, requesterId }, select: { id: true } });
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

app.post("/api/tickets/:ticketId/attachments", upload.single("file"), async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const requesterId = requestId(req.body?.requesterId);
  if (!ticketId || !requesterId || !req.file) {
    return res.status(400).json({ message: "An owned Ticket, requesterId, and one attachment file are required." });
  }

  const validation = isPermittedAttachment(req.file);
  if (!validation.valid) return res.status(validation.status).json({ message: validation.message });

  const prisma = getPrisma();
  try {
    const ownedTicket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterId }, select: { id: true } });
    if (!ownedTicket) return res.status(404).json({ message: "Ticket not found." });

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
  const requesterId = requestId(req.query.requesterId);
  if (!ticketId || !attachmentId || !requesterId) {
    return res.status(400).json({ message: "Ticket, attachment, and requester identifiers must be positive whole numbers." });
  }

  try {
    const attachment = await getPrisma().attachment.findFirst({
      where: { id: attachmentId, ticketId, removedAt: null, ticket: { requesterId } },
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

app.patch("/api/tickets/:ticketId/attachments/:attachmentId/remove", async (req, res) => {
  const ticketId = requestId(req.params.ticketId);
  const attachmentId = requestId(req.params.attachmentId);
  const validation = validateAttachmentRemoval(req.body);
  if (!ticketId || !attachmentId) {
    return res.status(400).json({ message: "Ticket and attachment identifiers must be positive whole numbers." });
  }
  if (!validation.value) {
    return res.status(422).json({ message: "Attachment removal validation failed", fieldErrors: validation.fieldErrors });
  }

  const { requesterId, reason } = validation.value;
  try {
    const attachment = await getPrisma().attachment.findFirst({
      where: { id: attachmentId, ticketId, ticket: { requesterId } },
      select: { id: true, removedAt: true },
    });
    if (!attachment) return res.status(404).json({ message: "Attachment not found." });
    if (attachment.removedAt) return res.status(409).json({ message: "This attachment has already been removed." });

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

  return res.status(500).json({ message: "Unable to complete the request" });
});

function isUniqueConstraintError(error: unknown): boolean {
  return errorCode(error) === "P2002";
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
