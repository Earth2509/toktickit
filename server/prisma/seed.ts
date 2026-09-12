import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data.js";

const prisma = new PrismaClient();

async function main() {
  await seedDatabase(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
