import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { PrismaClient, type User } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed-data.js";
import { app } from "../../src/app.js";

const configuredUrl = process.env.LAB4_PERFORMANCE_TEST_DATABASE_URL;
const testUrl = configuredUrl ? dedicatedPerformanceUrl(configuredUrl) : undefined;
let prisma: PrismaClient | undefined;
let requesterToken = "";
let staffToken = "";

// Intentionally excluded from routine test execution unless the guarded runner
// supplies a dedicated local schema. Timing is environment-specific smoke data.
describe.skipIf(!testUrl)("Lab 4 dashboard performance smoke", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS "lab4_dashboard_perf_test" CASCADE;');
    await prisma.$executeRawUnsafe('CREATE SCHEMA "lab4_dashboard_perf_test";');
    const activeSchema = await prisma.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
    expect(activeSchema[0].schema).toBe("lab4_dashboard_perf_test");

    const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
    execFileSync(process.execPath, [prismaCli, "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testUrl },
      stdio: "pipe",
    });
    await seedDatabase(prisma);
    const requester = await prisma.user.update({
      where: { email: "requester1@example.test" }, data: { mustChangePassword: false },
    });
    const staff = await prisma.user.update({
      where: { email: "staff1@example.test" }, data: { mustChangePassword: false },
    });
    requesterToken = await createSession(prisma, requester, "lab4-performance-requester");
    staffToken = await createSession(prisma, staff, "lab4-performance-staff");

    const tickets = await prisma.ticket.count();
    expect(tickets).toBeGreaterThanOrEqual(28);
    const databaseVersion = await prisma.$queryRaw<Array<{ version: string }>>`SELECT current_setting('server_version') AS version`;
    console.log(`Lab 4 performance context: ${tickets} seeded Tickets; PostgreSQL ${databaseVersion[0].version}; Node ${process.version}; ${os.platform()} ${os.arch()}; ${os.cpus()[0]?.model ?? "CPU unavailable"}.`);
  }, 60_000);

  it.each([
    ["Requester", "/api/requester/dashboard", () => requesterToken],
    ["Staff", "/api/staff/dashboard", () => staffToken],
  ])("keeps the %s dashboard p95 at or below 500 ms across 20 warm requests", async (role, endpoint, token) => {
    const samples: number[] = [];
    for (let index = 0; index < 25; index += 1) {
      const start = performance.now();
      const response = await request(app).get(endpoint).set("Cookie", `toktickit_session=${token()}`);
      const elapsed = performance.now() - start;
      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      if (index >= 5) samples.push(elapsed);
    }

    const ordered = [...samples].sort((a, b) => a - b);
    const p95 = ordered[Math.ceil(0.95 * ordered.length) - 1];
    console.log(`${role} dashboard: 5 warm-up requests, 20 measured requests; p95 ${p95.toFixed(1)} ms; max ${ordered.at(-1)?.toFixed(1)} ms.`);
    expect(p95).toBeLessThanOrEqual(500);
  }, 30_000);
});

afterAll(async () => {
  await prisma?.$disconnect();
});

async function createSession(database: PrismaClient, user: User, token: string) {
  await database.session.create({ data: {
    tokenHash: createHash("sha256").update(token).digest("base64url"),
    userId: user.id,
    credentialVersion: user.credentialVersion,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  } });
  return token;
}

function dedicatedPerformanceUrl(value: string) {
  const url = new URL(value);
  if (!["postgresql:", "postgres:"].includes(url.protocol)
    || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || url.searchParams.get("schema") !== "lab4_dashboard_perf_test"
    || process.env.DATABASE_URL !== url.toString()) {
    throw new Error("Performance smoke requires local PostgreSQL and the dedicated lab4_dashboard_perf_test schema.");
  }
  return url.toString();
}
