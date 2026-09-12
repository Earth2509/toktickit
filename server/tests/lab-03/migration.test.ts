import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed-data.js";
import { verifyPassword } from "../../src/auth.js";
import { provisionMigratedUser } from "../../src/provisioning.js";

const configuredUrl = process.env.MIGRATION_TEST_DATABASE_URL;
const testUrl = configuredUrl ? dedicatedMigrationUrl(configuredUrl) : undefined;
let prisma: PrismaClient | undefined;

// This is deliberately a separately invoked integration test. It can only
// target the named disposable schema and never uses the normal development DB.
describe.skipIf(!testUrl)("Lab 3 requester-to-user migration", () => {
  it("retains an existing ID, Ticket ownership, and attachment removal attribution", async () => {
    prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
    await recreateTestSchema(prisma, testUrl!);
    for (const migration of lab2MigrationDirectories) runMigration(migration, testUrl!);

    await prisma.$executeRawUnsafe(`INSERT INTO "Category" ("id", "name", "createdAt", "isActive") VALUES (1, 'Network', CURRENT_TIMESTAMP, true);`);
    await prisma.$executeRawUnsafe(`INSERT INTO "RelatedSystem" ("id", "name", "isActive", "createdAt", "updatedAt") VALUES (1, 'Campus Wi-Fi', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
    await prisma.$executeRawUnsafe(`INSERT INTO "Requester" ("id", "displayName", "email", "isActive", "createdAt", "updatedAt") VALUES (41, 'Migrated Requester', 'migrated@example.test', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Ticket" (
        "id", "ticketNumber", "requesterId", "categoryId", "relatedSystemId", "summary", "description",
        "requestedPriority", "currentStatus", "idempotencyKey", "createdAt", "updatedAt"
      ) VALUES (51, 'TT-2026-000051', 41, 1, 1, 'Preserve ownership', 'Migration verification record.', 'MEDIUM', 'NEW', 'migration-test-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Attachment" (
        "id", "ticketId", "activeSlot", "storageKey", "originalFilename", "mimeType", "sizeBytes",
        "createdAt", "removedAt", "removedByRequesterId", "removalReason"
      ) VALUES (61, 51, NULL, 'migration-storage-key', 'evidence.txt', 'text/plain', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 41, 'Migration evidence');
    `);
    // The fixture uses explicit IDs so relationship preservation is easy to
    // assert. Advance each SERIAL sequence to model a real populated database.
    for (const table of ["Category", "RelatedSystem", "Requester", "Ticket", "Attachment"]) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT MAX("id") FROM "${table}"), true);`,
      );
    }

    runMigration("20260912093000_lab3_auth_foundation", testUrl!);

    const user = await prisma.user.findUnique({ where: { id: 41 } });
    const ticket = await prisma.ticket.findUnique({ where: { id: 51 } });
    const attachment = await prisma.attachment.findUnique({ where: { id: 61 } });

    expect(user).toMatchObject({
      id: 41,
      email: "migrated@example.test",
      role: "REQUESTER",
      passwordHash: null,
      mustChangePassword: true,
    });
    expect(ticket).toMatchObject({ id: 51, requesterId: 41, ticketNumber: "TT-2026-000051" });
    expect(attachment).toMatchObject({ id: 61, ticketId: 51, removedByRequesterId: 41, removalReason: "Migration evidence" });

    const provisionedPassword = "Migration-only password 2026!";
    await provisionMigratedUser(prisma, " MIGRATED@EXAMPLE.TEST ", provisionedPassword);
    const provisionedUser = await prisma.user.findUnique({ where: { id: 41 } });
    expect(provisionedUser?.passwordHash).toEqual(expect.any(String));
    await expect(verifyPassword(provisionedPassword, provisionedUser!.passwordHash!)).resolves.toBe(true);
    const originalProvisionedHash = provisionedUser!.passwordHash;
    await expect(provisionMigratedUser(prisma, "migrated@example.test", "Another password 2026!")).rejects.toThrow(
      "Credentials already exist",
    );
    expect((await prisma.user.findUnique({ where: { id: 41 } }))?.passwordHash).toBe(originalProvisionedHash);

    await runSeed(prisma);
    const seededFixture = await prisma.user.findUnique({ where: { email: "requester1@example.test" } });
    expect(seededFixture).toMatchObject({ mustChangePassword: true, role: "REQUESTER", isActive: true });
    expect((await prisma.user.findUnique({ where: { id: 41 } }))?.passwordHash).toBe(originalProvisionedHash);

    await prisma.user.update({ where: { id: seededFixture!.id }, data: { isActive: false, passwordHash: "preserved-local-test-hash" } });
    await runSeed(prisma);
    expect(await prisma.user.findUnique({ where: { id: seededFixture!.id } })).toMatchObject({
      isActive: false,
      passwordHash: "preserved-local-test-hash",
    });
  }, 30_000);

  it("stops before renaming tables when normalized requester emails collide", async () => {
    prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
    await recreateTestSchema(prisma, testUrl!);
    for (const migration of lab2MigrationDirectories) runMigration(migration, testUrl!);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Requester" ("displayName", "email", "isActive", "createdAt", "updatedAt")
      VALUES
        ('Collision One', 'collision@example.test', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('Collision Two', ' COLLISION@EXAMPLE.TEST ', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);

    expect(() => runMigration("20260912093000_lab3_auth_foundation", testUrl!)).toThrow();
    const requesterTable = await prisma.$queryRaw<Array<{ name: string | null }>>`
      SELECT to_regclass('"Requester"')::text AS name
    `;
    expect(requesterTable[0]?.name).toBe('"Requester"');
  }, 30_000);
});

afterAll(async () => {
  if (!prisma || !testUrl) return;
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "lab3_migration_test" CASCADE;`);
  await prisma.$disconnect();
});

const lab2MigrationDirectories = [
  "20260812153000_create_category",
  "20260827090000_lab2_requester_foundation",
  "20260828150000_lab2_ticket_creation",
  "20260829160000_lab2_ticket_attachments",
  "20260830090000_harden_attachment_uploads",
];

function dedicatedMigrationUrl(value: string): string {
  const url = new URL(value);
  if (url.searchParams.get("schema") !== "lab3_migration_test") {
    throw new Error("MIGRATION_TEST_DATABASE_URL must use the dedicated lab3_migration_test schema.");
  }
  return url.toString();
}

async function recreateTestSchema(client: PrismaClient, databaseUrl: string) {
  const schema = new URL(databaseUrl).searchParams.get("schema");
  if (schema !== "lab3_migration_test") throw new Error("Unexpected migration-test schema.");
  await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
  await client.$executeRawUnsafe(`CREATE SCHEMA "${schema}";`);
}

function runMigration(directory: string, databaseUrl: string) {
  const serverDirectory = process.cwd();
  const prismaCli = path.join(serverDirectory, "node_modules", "prisma", "build", "index.js");
  const migrationFile = path.join(serverDirectory, "prisma", "migrations", directory, "migration.sql");
  execFileSync(process.execPath, [prismaCli, "db", "execute", "--schema", "prisma/schema.prisma", "--file", migrationFile], {
    cwd: serverDirectory,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}

async function runSeed(client: PrismaClient) {
  process.env.LAB3_SEED_MODE = "local";
  process.env.LAB3_SEED_PASSWORD = "migration-test-only-password";
  process.env.NODE_ENV = "test";
  await seedDatabase(client);
}
