import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const categoryNames = ["Account and Access", "Hardware", "Software", "Network"];

async function main() {
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
