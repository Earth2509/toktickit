// Read-only inventory of local Requester accounts; never prints credentials.
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
if (!process.env.DATABASE_URL || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname)) {
  throw new Error("A configured local database is required.");
}
const prisma = new PrismaClient();
try {
  const result = await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const users = await tx.user.findMany({
      where: { role: "REQUESTER" },
      orderBy: { id: "asc" },
      select: { id: true, displayName: true, email: true, isActive: true },
    });
    return Promise.all(users.map(async user => ({
      ...user,
      ownedTicketCount: await tx.ticket.count({ where: { requesterId: user.id } }),
    })));
  }, { isolationLevel: "RepeatableRead" });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Read-only Requester inventory failed:", error?.name ?? "Unknown", error?.code ?? "unavailable");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
