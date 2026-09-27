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
  await seedLab4Actions(prisma);
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

/**
 * Lab 4 demonstration records are identified through reserved idempotency
 * keys, rather than mutable prose. Re-running the local seed therefore never
 * duplicates an Action after a tester has edited its visible description.
 */
async function seedLab4Actions(prisma: PrismaClient) {
  const [staff, tickets] = await Promise.all([
    prisma.user.findMany({ where: { role: "IT_STAFF", isActive: true }, orderBy: { id: "asc" }, select: { id: true } }),
    prisma.ticket.findMany({ where: { idempotencyKey: { in: ["lab3-queue-fixture-2", "lab3-queue-fixture-3", "lab3-queue-fixture-4"] } }, orderBy: { id: "asc" }, select: { id: true } }),
  ]);
  if (staff.length === 0 || tickets.length !== 3) return;
  const definitions = [
    {
      key: "lab4-seed-action-1",
      ticketId: tickets[0]!.id,
      performedById: staff[0]!.id,
      assignedToId: staff[0]!.id,
      status: "COMPLETED" as const,
      actionAt: new Date("2026-09-01T08:30:00.000Z"),
      completedAt: new Date("2026-09-01T09:00:00.000Z"),
      description: "Verified the service account configuration and applied the approved correction.",
      result: "The service account now authenticates successfully.",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "Configuration evidence is retained in the support record.",
    },
    {
      key: "lab4-seed-action-2",
      ticketId: tickets[1]!.id,
      performedById: staff[1 % staff.length]!.id,
      assignedToId: staff[1 % staff.length]!.id,
      status: "OPEN" as const,
      actionAt: new Date("2026-09-02T10:15:00.000Z"),
      completedAt: null,
      description: "Collected diagnostic logs and started a controlled connectivity investigation.",
      result: null,
      followUpRequired: true,
      followUpNote: "Confirm connectivity with the requester after the network change window.",
      attachmentNotes: "Diagnostic log bundle is referenced by the incident record.",
    },
    {
      key: "lab4-seed-action-3",
      ticketId: tickets[2]!.id,
      performedById: staff[0]!.id,
      assignedToId: staff[1 % staff.length]!.id,
      status: "COMPLETED" as const,
      actionAt: new Date("2026-09-03T13:00:00.000Z"),
      completedAt: new Date("2026-09-03T13:45:00.000Z"),
      description: "Replaced the affected configuration and completed a service validation check.",
      result: "The requested service path passed the validation check.",
      followUpRequired: true,
      followUpNote: "Requester confirmation is still required before final Ticket resolution.",
      attachmentNotes: null,
    },
  ];

  for (const definition of definitions) {
    await prisma.$transaction(async (transaction) => {
      const existing = await transaction.actionTakenIdempotency.findUnique({
        where: { actorId_ticketId_key: { actorId: definition.performedById, ticketId: definition.ticketId, key: definition.key } },
        select: { id: true },
      });
      if (existing) return;
      const action = await transaction.actionTaken.create({ data: definition, select: { id: true } });
      await transaction.actionTakenIdempotency.create({
        data: {
          actorId: definition.performedById,
          ticketId: definition.ticketId,
          key: definition.key,
          fingerprint: "local-lab4-seed",
          actionTakenId: action.id,
          expiresAt: new Date("2999-12-31T23:59:59.999Z"),
        },
      });
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
