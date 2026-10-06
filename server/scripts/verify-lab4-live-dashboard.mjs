// Read-only evidence helper: no inserts, updates, schema changes or resets.
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
const connection = process.env.DATABASE_URL;
if (!connection) throw new Error("Configure server/.env before running this read-only check.");
const host = new URL(connection).hostname;
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
  throw new Error("This evidence helper permits a local database only.");
}
const prisma = new PrismaClient();
try {
  const candidates = await prisma.user.findMany({
    where: { displayName: "Kamon IT Support", isActive: true, role: "IT_STAFF" },
    select: { id: true, displayName: true, role: true },
  });
  if (candidates.length !== 1) throw new Error("Expected exactly one active Kamon IT Support fixture account.");
  const user = candidates[0];
  const operational = { currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] } };
  const result = await prisma.$transaction(async (tx) => ({
    user,
    metrics: {
      unassigned: await tx.ticket.count({ where: { ...operational, ownerId: null } }),
      ownedByMe: await tx.ticket.count({ where: { ...operational, ownerId: user.id } }),
      urgent: await tx.ticket.count({ where: { ...operational, itPriority: { in: ["HIGH", "URGENT"] } } }),
      waitingForRequester: await tx.ticket.count({ where: { currentStatus: "WAITING_FOR_REQUESTER" } }),
    },
    ownedTickets: await tx.ticket.findMany({
      where: { ...operational, ownerId: user.id }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { ticketNumber: true, currentStatus: true },
    }),
    totalPerformedActions: await tx.actionTaken.count({ where: { performedById: user.id } }),
    recentActions: await tx.actionTaken.findMany({
      where: { performedById: user.id }, orderBy: [{ actionAt: "desc" }, { id: "desc" }], take: 5,
      select: { id: true, status: true, ticket: { select: { ticketNumber: true } } },
    }),
  }), { isolationLevel: "RepeatableRead" });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Read-only Dashboard verification failed; check the local database and fixture account. No credentials are printed.");
  console.error("Error type:", error?.name ?? "Unknown", "code:", error?.code ?? error?.errorCode ?? "unavailable");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
