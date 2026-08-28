import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { getPrisma } from "./prisma.js";
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

    return res.status(503).json({ message: "Unable to complete the request" });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON body." });
  }

  return next(error);
});

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export default app;
