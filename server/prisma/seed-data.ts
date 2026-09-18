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

  await seedQueueTickets(prisma);
}

/**
 * Read-only queue fixtures for Lab 3. Stable idempotency keys make a second
 * local seed safe and give the queue enough rows to exercise pagination.
 */
async function seedQueueTickets(prisma: PrismaClient) {
  const [categories, systems, requesters, staff] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.relatedSystem.findMany({ orderBy: { id: "asc" } }),
    prisma.user.findMany({ where: { role: "REQUESTER", isActive: true }, orderBy: { id: "asc" } }),
    prisma.user.findMany({ where: { role: "IT_STAFF", isActive: true }, orderBy: { id: "asc" } }),
  ]);
  if (!categories.length || !systems.length || !requesters.length) return;
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const statuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"] as const;
  for (let index = 1; index <= 28; index += 1) {
    const priority = priorities[(index - 1) % priorities.length]!;
    await prisma.ticket.upsert({
      where: { idempotencyKey: `lab3-queue-fixture-${index}` },
      update: {},
      create: {
        ticketNumber: `TT-2026-${String(index).padStart(6, "0")}`,
        idempotencyKey: `lab3-queue-fixture-${index}`,
        requesterId: requesters[(index - 1) % requesters.length]!.id,
        categoryId: categories[(index - 1) % categories.length]!.id,
        relatedSystemId: systems[(index - 1) % systems.length]!.id,
        summary: `Lab 3 queue sample ${index}: service request`,
        description: "Seeded local data for the IT Staff queue, search, filters and pagination evidence.",
        requestedPriority: priority,
        itPriority: priority,
        currentStatus: statuses[(index - 1) % statuses.length]!,
        ownerId: index % 3 === 0 ? null : staff.length ? staff[(index - 1) % staff.length]!.id : null,
      },
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
