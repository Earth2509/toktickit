import { createHash, createHmac, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient, type User, type UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// This suite intentionally uses a separate PostgreSQL schema. The mocked API
// suite covers input and response shapes; these cases prove the two guarantees
// that mocks cannot: the advisory lock under concurrent requests and the
// session/ticket/event work committed in one real transaction.
const configuredUrl = process.env.ADMIN_USERS_TEST_DATABASE_URL;
const testUrl = configuredUrl ? dedicatedAdminUsersUrl(configuredUrl) : undefined;
const csrfSecret = "admin-user-integration-test-secret";
let prisma: PrismaClient | undefined;
let app: (typeof import("../../src/app.js"))["app"] | undefined;

describe.skipIf(!testUrl)("Lab 3 Administrator user management integration", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl!;
    process.env.AUTH_CSRF_SECRET = csrfSecret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    resetSchema(testUrl!);
    prisma = new PrismaClient({ datasources: { db: { url: testUrl! } } });
    app = (await import("../../src/app.js")).app;
  }, 30_000);

  beforeEach(async () => {
    const database = requiredPrisma();
    await database.ticketEvent.deleteMany();
    await database.session.deleteMany();
    await database.ticket.deleteMany();
    await database.category.deleteMany();
    await database.relatedSystem.deleteMany();
    await database.user.deleteMany();
  });

  it("serializes concurrent Administrator deactivations so one active Administrator survives", async () => {
    const first = await createUser("First Admin", "first.admin@example.test", "ADMINISTRATOR");
    const second = await createUser("Second Admin", "second.admin@example.test", "ADMINISTRATOR");
    const [firstSession, secondSession] = await Promise.all([sessionFor(first), sessionFor(second)]);

    const [deactivateSecond, deactivateFirst] = await Promise.all([
      patchUser(firstSession, second, { isActive: false }),
      patchUser(secondSession, first, { isActive: false }),
    ]);

    expect([deactivateSecond.status, deactivateFirst.status].sort()).toEqual([200, 403]);
    expect(await requiredPrisma().user.count({ where: { role: "ADMINISTRATOR", isActive: true } })).toBe(1);
  });

  it("revokes the changed account's sessions and atomically unassigns only active work with audit history", async () => {
    const administrator = await createUser("Administrator", "administrator@example.test", "ADMINISTRATOR");
    const departingStaff = await createUser("Departing Staff", "departing.staff@example.test", "IT_STAFF");
    const requester = await createUser("Requester", "requester@example.test", "REQUESTER");
    const [category, relatedSystem] = await Promise.all([
      requiredPrisma().category.create({ data: { name: "Integration category" } }),
      requiredPrisma().relatedSystem.create({ data: { name: "Integration system" } }),
    ]);
    const [activeTicket, historicalTicket] = await Promise.all([
      createTicket("TT-ADMIN-000001", "active-work", departingStaff.id, requester.id, category.id, relatedSystem.id, "OPEN"),
      createTicket("TT-ADMIN-000002", "closed-work", departingStaff.id, requester.id, category.id, relatedSystem.id, "CLOSED"),
    ]);
    const [administratorSession, departingSession] = await Promise.all([sessionFor(administrator), sessionFor(departingStaff)]);

    const response = await patchUser(administratorSession, departingStaff, { isActive: false });
    expect(response.status).toBe(200);

    await expect(requiredPrisma().session.count({ where: { tokenHash: departingSession.tokenHash } })).resolves.toBe(0);
    await expect(requiredPrisma().session.count({ where: { tokenHash: administratorSession.tokenHash } })).resolves.toBe(1);
    await expect(requiredPrisma().ticket.findUnique({ where: { id: activeTicket.id } })).resolves.toMatchObject({ ownerId: null, version: 2 });
    await expect(requiredPrisma().ticket.findUnique({ where: { id: historicalTicket.id } })).resolves.toMatchObject({ ownerId: departingStaff.id, currentStatus: "CLOSED" });
    await expect(requiredPrisma().ticketEvent.findMany({ where: { ticketId: activeTicket.id, type: "OWNER_UNASSIGNED_ACCOUNT_CHANGE" } })).resolves.toHaveLength(1);
  });
});

afterAll(async () => {
  if (!prisma || !testUrl) return;
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS "lab3_admin_users_test" CASCADE;');
  await prisma.$disconnect();
});

function requiredPrisma(): PrismaClient {
  if (!prisma) throw new Error("Administrator integration database was not initialized.");
  return prisma;
}

function requiredApp() {
  if (!app) throw new Error("Administrator integration app was not initialized.");
  return app;
}

function dedicatedAdminUsersUrl(value: string): string {
  const url = new URL(value);
  if (url.searchParams.get("schema") !== "lab3_admin_users_test") {
    throw new Error("ADMIN_USERS_TEST_DATABASE_URL must use the dedicated lab3_admin_users_test schema.");
  }
  return url.toString();
}

function resetSchema(databaseUrl: string) {
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate", "--force-reset"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}

async function createUser(displayName: string, email: string, role: UserRole): Promise<User> {
  return requiredPrisma().user.create({ data: { displayName, email, role, isActive: true, mustChangePassword: false } });
}

async function createTicket(ticketNumber: string, key: string, ownerId: number, requesterId: number, categoryId: number, relatedSystemId: number, currentStatus: "OPEN" | "CLOSED") {
  return requiredPrisma().ticket.create({
    data: {
      ticketNumber,
      idempotencyKey: `admin-integration-${key}`,
      requesterId,
      categoryId,
      relatedSystemId,
      ownerId,
      summary: `Integration ${key}`,
      description: "Administrator integration test fixture.",
      requestedPriority: "MEDIUM",
      itPriority: "MEDIUM",
      currentStatus,
    },
  });
}

async function sessionFor(user: User): Promise<{ cookie: string; csrf: string; tokenHash: string }> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("base64url");
  await requiredPrisma().session.create({ data: { tokenHash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt: new Date(Date.now() + 60_000) } });
  return {
    cookie: `toktickit_session=${token}`,
    csrf: createHmac("sha256", csrfSecret).update(tokenHash).digest("base64url"),
    tokenHash,
  };
}

function patchUser(session: { cookie: string; csrf: string }, target: User, overrides: Partial<{ displayName: string; email: string; role: UserRole; isActive: boolean }>) {
  return request(requiredApp()).patch(`/api/admin/users/${target.id}`)
    .set("Cookie", session.cookie)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", session.csrf)
    .send({ displayName: target.displayName, email: target.email, role: target.role, isActive: target.isActive, version: target.version, ...overrides });
}
