import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { getPrisma } from "./prisma.js";
import { ticketListOrderBy, ticketListWhere, validateTicketListQuery } from "./ticket-query.js";
import { formatTicketNumber, matchesTicketCreate, validateTicketCreate } from "./tickets.js";

export const app = express();
app.use(cors());
app.use(express.json());
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
          description: true,
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
      totalPages: Math.ceil(totalItems / query.pageSize),
    });
  } catch (error) {
    if (isDependencyUnavailable(error)) {
      return res.status(503).json({ message: "Ticket service is temporarily unavailable." });
    }

    return res.status(500).json({ message: "Unable to load Tickets" });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON body." });
  }

  if (statusCode(error) === 413) {
    return res.status(413).json({ message: "Request payload is too large." });
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

export default app;
