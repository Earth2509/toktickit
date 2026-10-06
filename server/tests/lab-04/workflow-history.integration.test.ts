import { createHash, createHmac, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient, type User } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const configured = process.env.LAB4_HISTORY_TEST_DATABASE_URL;
const url = configured ? new URL(configured) : undefined;
const schema = url?.searchParams.get("schema");
if (url && (!["postgresql:", "postgres:"].includes(url.protocol)
  || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  || !/^lab4_history_test_[a-f0-9]{12}$/.test(schema ?? "")
  || process.env.DATABASE_URL !== url.toString())) {
  throw new Error("Use the guarded test:lab4-history runner with a fresh local history schema.");
}
const csrfSecret = "disposable-history-test-only";
let database: PrismaClient | undefined;
let app: (typeof import("../../src/app.js"))["app"];
let createdSchema = false;

describe.skipIf(!url)("Lab 4 real workflow audit history", () => {
  beforeAll(async () => {
    process.env.AUTH_CSRF_SECRET = csrfSecret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    database = new PrismaClient({ datasources: { db: { url: url!.toString() } } });
    // No IF NOT EXISTS: refuse to reuse another run's data.
    await database.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    createdSchema = true;
    // Tests API history on the current Prisma model via db push, not migration execution.
    // Migration preservation is verified by the separate Lab 4 migration integration suite.
    execFileSync(process.execPath, [path.join(process.cwd(), "node_modules/prisma/build/index.js"), "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url!.toString() }, stdio: "pipe",
    });
    const active = await database.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
    expect(active[0].schema).toBe(schema);
    app = (await import("../../src/app.js")).app;
  }, 30_000);

  it("appends immutable prior events, orders equal timestamps by ID, and leaves history unchanged after denied writes", async () => {
    const db = database!;
    const staff = await db.user.create({ data: { displayName: "History Staff", email: "history.staff@example.test", role: "IT_STAFF", mustChangePassword: false } });
    const requester = await db.user.create({ data: { displayName: "History Requester", email: "history.requester@example.test", role: "REQUESTER", mustChangePassword: false } });
    const category = await db.category.create({ data: { name: "History fixture" } });
    const system = await db.relatedSystem.create({ data: { name: "History fixture" } });
    const ticket = await db.ticket.create({ data: {
      ticketNumber: "TT-2026-900099", idempotencyKey: "history-only-fixture", requesterId: requester.id,
      ownerId: staff.id, categoryId: category.id, relatedSystemId: system.id,
      summary: "Isolated audit history", description: "Disposable fixture; never public data.",
      requestedPriority: "MEDIUM", itPriority: "MEDIUM", currentStatus: "OPEN",
    } });
    const timestamp = new Date("2026-09-25T09:00:00.000Z");
    // Equal times deliberately exercise the ID tie-breaker in recorded DB reads.
    for (const type of ["FIXTURE_CREATED", "FIXTURE_BASELINE"]) {
      await db.ticketEvent.create({ data: { ticketId: ticket.id, actorId: staff.id, type, before: {}, after: { fixture: true }, createdAt: timestamp } });
    }
    const history = () => db.ticketEvent.findMany({ where: { ticketId: ticket.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    const before = await history();
    expect(before.map(event => event.id)).toEqual([...before.map(event => event.id)].sort((a, b) => a - b));
    const staffSession = await sessionFor(staff);
    const requesterSession = await sessionFor(requester);
    const mutate = (session: { cookie: string; csrf: string }, version: number, currentStatus: string) => request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`).set("Cookie", session.cookie)
      .set("Origin", "http://localhost:5173").set("X-CSRF-Token", session.csrf).send({ version, currentStatus });

    const first = await mutate(staffSession, 1, "IN_PROGRESS");
    expect(first.status).toBe(200);
    const afterFirst = await history();
    expect(afterFirst).toHaveLength(before.length + 1);
    expect(afterFirst.slice(0, before.length)).toEqual(before);
    expect(afterFirst.at(-1)).toMatchObject({ actorId: staff.id, type: "STATUS_CHANGED", before: { currentStatus: "OPEN", version: 1 }, after: { currentStatus: "IN_PROGRESS", version: 2 } });
    const second = await mutate(staffSession, 2, "WAITING_FOR_REQUESTER");
    expect(second.status).toBe(200);
    const afterSecond = await history();
    expect(afterSecond.slice(0, afterFirst.length)).toEqual(afterFirst);
    expect(afterSecond).toHaveLength(before.length + 2);
    expect(afterSecond.at(-1)).toMatchObject({ before: { currentStatus: "IN_PROGRESS", version: 2 }, after: { currentStatus: "WAITING_FOR_REQUESTER", version: 3 } });
    expect(await history()).toEqual(afterSecond);
    expect((await mutate(staffSession, 1, "OPEN")).status).toBe(409);
    expect((await mutate(requesterSession, 3, "OPEN")).status).toBe(403);
    expect(await history()).toEqual(afterSecond);
    expect(await db.ticket.findUnique({ where: { id: ticket.id } })).toMatchObject({ currentStatus: "WAITING_FOR_REQUESTER", version: 3, ownerId: staff.id });
    console.log("History proof: two real API transitions appended one event each; prior rows unchanged; tied timestamps ordered by ID; repeated reads equal; stale 409 and Requester 403 appended nothing.");
    console.log(JSON.stringify({ before, afterFirst, afterSecond, deniedWrites: [409, 403] }, null, 2));
  });
});

afterAll(async () => {
  if (database) {
    // Validated local URL + exact fresh schema + successful creation required.
    if (createdSchema && /^lab4_history_test_[a-f0-9]{12}$/.test(schema ?? "")) await database.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await database.$disconnect();
  }
});

async function sessionFor(user: User) {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("base64url");
  await database!.session.create({ data: { tokenHash: hash, userId: user.id, credentialVersion: user.credentialVersion, expiresAt: new Date(Date.now() + 60_000) } });
  return { cookie: `toktickit_session=${token}`, csrf: createHmac("sha256", csrfSecret).update(hash).digest("base64url") };
}
