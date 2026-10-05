// Independent, read-only metric checks for the observed local Requester accounts.
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname)) {
  throw new Error("A configured local database is required.");
}
const prisma = new PrismaClient();
try {
  const email = process.argv[2] ?? "requester1@example.test";
  const expectedName = {
    "requester1@example.test": "Aree Chaiyasit",
    "anan.chaiyasit@toktickit.local": "Anan Chaiyasit",
  }[email];
  if (!expectedName) throw new Error("Select one of the two observed Requester accounts.");
  const measuredAt = new Date();
  const cutoff = new Date(measuredAt.getTime() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const user = await tx.user.findUniqueOrThrow({
      where: { email },
      select: { id: true, displayName: true, role: true, isActive: true },
    });
    if (user.displayName !== expectedName || user.role !== "REQUESTER" || !user.isActive) {
      throw new Error("Expected the selected observed active Requester account.");
    }
    const own = { requesterId: user.id };
    return {
      measuredAt, cutoff, user,
      ownedTicketCount: await tx.ticket.count({ where: own }),
      metrics: {
        openTickets: await tx.ticket.count({ where: { ...own, currentStatus: { in: ["NEW", "OPEN", "IN_PROGRESS", "REOPENED"] } } }),
        waitingForRequester: await tx.ticket.count({ where: { ...own, currentStatus: "WAITING_FOR_REQUESTER" } }),
        recentlyUpdated: await tx.ticket.count({ where: { ...own, updatedAt: { gte: cutoff } } }),
        recentlyResolved: await tx.ticket.count({ where: { ...own, currentStatus: { in: ["RESOLVED", "CLOSED"] }, events: { some: { type: "STATUS_CHANGED", after: { path: ["currentStatus"], equals: "RESOLVED" }, createdAt: { gte: cutoff } } } } }),
      },
      recentTickets: await tx.ticket.findMany({
        where: own, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 5,
        select: { id: true, ticketNumber: true, requesterId: true, currentStatus: true, updatedAt: true },
      }),
    };
  }, { isolationLevel: "RepeatableRead" });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Read-only Requester verification failed:", error?.name ?? "Unknown", error?.code ?? "unavailable");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
