import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const categoryNames = ["Account and Access", "Hardware", "Software", "Network"];

const requesters = [
  { displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local", isActive: true },
  { displayName: "Busaba Wattanakul", email: "busaba.wattanakul@toktickit.local", isActive: true },
  { displayName: "Chanin Rattanakul", email: "chanin.rattanakul@toktickit.local", isActive: true },
  { displayName: "Daran Phromchai", email: "daran.phromchai@toktickit.local", isActive: true },
  { displayName: "Inactive Test Requester", email: "inactive.requester@toktickit.local", isActive: false },
];

const relatedSystems = [
  "Campus Wi-Fi",
  "Corporate Laptop",
  "Email",
  "Grade Submission App",
  "LEB2 App",
  "VPN",
];

async function main() {
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const requester of requesters) {
    await prisma.requester.upsert({
      where: { email: requester.email },
      update: { displayName: requester.displayName, isActive: requester.isActive },
      create: requester,
    });
  }

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
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
