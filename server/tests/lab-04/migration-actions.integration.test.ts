import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed-data.js";

const configuredUrl = process.env.LAB4_MIGRATION_TEST_DATABASE_URL;
const testUrl = configuredUrl ? dedicatedMigrationUrl(configuredUrl) : undefined;
let prisma: PrismaClient | undefined;

const priorMigrations = [
  "20260812153000_create_category",
  "20260827090000_lab2_requester_foundation",
  "20260828150000_lab2_ticket_creation",
  "20260829160000_lab2_ticket_attachments",
  "20260830090000_harden_attachment_uploads",
  "20260912093000_lab3_auth_foundation",
  "20260915113000_lab3_staff_queue",
  "20260916090000_lab3_ticket_workflow",
  "20260916103000_lab3_ticket_discussions",
];

// This suite destroys only the explicitly named disposable schema. It is
// opt-in so the normal unit/API command can never reset a user's database.
describe.skipIf(!testUrl)("Lab 4 Actions Taken migration", () => {
  it("preserves Lab 3 relationships and keeps a repeated Lab 4 seed idempotent", async () => {
    const database = new PrismaClient({ datasources: { db: { url: testUrl } } });
    prisma = database;
    await database.$executeRawUnsafe('DROP SCHEMA IF EXISTS "lab4_migration_test" CASCADE;');
    await database.$executeRawUnsafe('CREATE SCHEMA "lab4_migration_test";');
    for (const directory of priorMigrations) runMigration(directory, testUrl!);

    const category = await database.category.create({ data: { name: "Legacy Lab 3 category" } });
    const system = await database.relatedSystem.create({ data: { name: "Legacy Lab 3 system" } });
    const requester = await database.user.create({ data: {
      displayName: "Legacy Requester", email: "legacy.lab4@example.test", role: "REQUESTER",
      passwordHash: "preserved-password-hash", mustChangePassword: false,
    } });
    const staff = await database.user.create({ data: {
      displayName: "Legacy Staff", email: "legacy.staff@example.test", role: "IT_STAFF",
      passwordHash: "preserved-staff-hash", mustChangePassword: false,
    } });
    const ticket = await database.ticket.create({ data: {
      ticketNumber: "TT-2026-900001", idempotencyKey: "lab4-migration-legacy-ticket",
      requesterId: requester.id, categoryId: category.id, relatedSystemId: system.id,
      ownerId: staff.id, summary: "Preserve this Lab 3 Ticket",
      description: "Historical data must survive the Lab 4 migration.",
      requestedPriority: "MEDIUM", itPriority: "HIGH", currentStatus: "IN_PROGRESS",
    } });
    const attachment = await database.attachment.create({ data: {
      ticketId: ticket.id, storageKey: "lab4-migration-legacy-attachment",
      originalFilename: "legacy-evidence.pdf", mimeType: "application/pdf", sizeBytes: 128,
      removedAt: new Date("2026-09-20T10:00:00.000Z"),
      removedByRequesterId: requester.id, removalReason: "Legacy soft removal",
    } });
    const comment = await database.publicComment.create({ data: {
      ticketId: ticket.id, authorId: requester.id, content: "Preserve this public comment.",
    } });
    const note = await database.internalNote.create({ data: {
      ticketId: ticket.id, authorId: staff.id, content: "Preserve this private note.",
    } });

    runMigration("20260925090000_lab4_actions_taken", testUrl!);
    expect(await database.ticket.findUnique({ where: { id: ticket.id } })).toMatchObject({
      id: ticket.id, requesterId: requester.id, ownerId: staff.id,
      requestedPriority: "MEDIUM", itPriority: "HIGH", currentStatus: "IN_PROGRESS",
      version: ticket.version,
    });
    expect(await database.user.findUnique({ where: { id: requester.id } })).toMatchObject({
      email: requester.email, passwordHash: "preserved-password-hash", mustChangePassword: false,
    });
    expect(await database.attachment.findUnique({ where: { id: attachment.id } })).toMatchObject({
      ticketId: ticket.id, removedByRequesterId: requester.id, removalReason: "Legacy soft removal",
    });
    expect(await database.publicComment.findUnique({ where: { id: comment.id } })).toMatchObject({ content: comment.content });
    expect(await database.internalNote.findUnique({ where: { id: note.id } })).toMatchObject({ content: note.content });
    expect(await database.actionTaken.count({ where: { ticketId: ticket.id } })).toBe(0);

    const priorSeedMode = process.env.LAB3_SEED_MODE;
    process.env.LAB3_SEED_MODE = "local";
    try {
      await seedDatabase(database);
      await seedDatabase(database);
    } finally {
      if (priorSeedMode === undefined) delete process.env.LAB3_SEED_MODE;
      else process.env.LAB3_SEED_MODE = priorSeedMode;
    }
    expect(await database.actionTaken.count()).toBe(3);
    expect(await database.actionTakenIdempotency.count()).toBe(3);
    expect(await database.actionTaken.count({ where: { ticketId: ticket.id } })).toBe(0);
    expect(await database.ticket.findUnique({ where: { id: ticket.id } })).toMatchObject({
      requesterId: requester.id, ownerId: staff.id, currentStatus: "IN_PROGRESS", itPriority: "HIGH",
    });
  }, 60_000);
});

afterAll(async () => {
  await prisma?.$disconnect();
});

function dedicatedMigrationUrl(value: string) {
  const url = new URL(value);
  if (!["postgresql:", "postgres:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || url.searchParams.get("schema") !== "lab4_migration_test") {
    throw new Error("LAB4_MIGRATION_TEST_DATABASE_URL must use local PostgreSQL and the disposable lab4_migration_test schema.");
  }
  return url.toString();
}

function runMigration(directory: string, databaseUrl: string) {
  const serverDirectory = process.cwd();
  const prismaCli = path.join(serverDirectory, "node_modules", "prisma", "build", "index.js");
  const migrationFile = path.join(serverDirectory, "prisma", "migrations", directory, "migration.sql");
  execFileSync(process.execPath, [prismaCli, "db", "execute", "--schema", "prisma/schema.prisma", "--file", migrationFile], {
    cwd: serverDirectory,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}
