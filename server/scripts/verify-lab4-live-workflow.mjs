// Read-only snapshot of the specifically approved local demonstration fixture.
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname)) {
  throw new Error("A local configured database is required.");
}
const prisma = new PrismaClient();
try {
  const snapshot = await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    return tx.ticket.findUniqueOrThrow({
      where: { ticketNumber: "TT-2026-000021" },
      select: {
        id: true, ticketNumber: true, currentStatus: true, version: true, ownerId: true,
        resolutionSummary: true,
        actionsTaken: { orderBy: { id: "asc" }, select: { id: true, status: true, version: true, performedById: true, assignedToId: true, completedAt: true, followUpRequired: true, result: true } },
        events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, actorId: true, type: true, before: true, after: true, reason: true, createdAt: true } },
      },
    });
  }, { isolationLevel: "RepeatableRead" });
  console.log(JSON.stringify(snapshot, null, 2));
} catch (error) {
  console.error("Read-only fixture verification failed:", error?.name ?? "Unknown", error?.code ?? "unavailable");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
