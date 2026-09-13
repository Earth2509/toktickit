import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth.js";

const categoryNames = ["Account and Access", "Hardware", "Software", "Network"];

const fixtureUsers = [
  { displayName: "Aree Chaiyasit", email: "requester1@example.test", role: "REQUESTER", isActive: true },
  { displayName: "Busaba Wattanakul", email: "requester2@example.test", role: "REQUESTER", isActive: true },
  { displayName: "Chanin Rattanakul", email: "requester3@example.test", role: "REQUESTER", isActive: true },
  { displayName: "Daran Phromchai", email: "requester4@example.test", role: "REQUESTER", isActive: true },
  { displayName: "Inactive Test Requester", email: "requester-inactive@example.test", role: "REQUESTER", isActive: false },
  { displayName: "Kamon IT Support", email: "staff1@example.test", role: "IT_STAFF", isActive: true },
  { displayName: "Lalita IT Support", email: "staff2@example.test", role: "IT_STAFF", isActive: true },
  { displayName: "Narin IT Support", email: "staff3@example.test", role: "IT_STAFF", isActive: true },
  { displayName: "Inactive IT Support", email: "staff-inactive@example.test", role: "IT_STAFF", isActive: false },
  { displayName: "System Administrator", email: "admin@example.test", role: "ADMINISTRATOR", isActive: true },
] as const;

const relatedSystems = [
  "Campus Wi-Fi",
  "Corporate Laptop",
  "Email",
  "Grade Submission App",
  "LEB2 App",
  "VPN",
];

export async function seedDatabase(prisma: PrismaClient) {
  assertLocalFixtureSeed();
  const fixturePassword = process.env.LAB3_SEED_PASSWORD ?? "Lab3-Demo-Only!2026";
  const passwordHash = await hashPassword(fixturePassword);

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const user of fixtureUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      // A repeated seed must never reset a password, role, activation state or
      // work already performed with a fixture account.
      update: {},
      create: {
        ...user,
        passwordHash,
        mustChangePassword: true,
      },
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

function assertLocalFixtureSeed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Lab 3 fixture seeding is disabled in production.");
  }
  if (process.env.LAB3_SEED_MODE !== "local") {
    throw new Error("Set LAB3_SEED_MODE=local before creating Lab 3 demo accounts.");
  }
}
