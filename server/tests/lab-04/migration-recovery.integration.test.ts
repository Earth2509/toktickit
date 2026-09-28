import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed-data.js";

const sourceUrl = process.env.LAB4_RECOVERY_SOURCE_URL;
const targetUrl = process.env.LAB4_RECOVERY_TARGET_URL;
if (sourceUrl || targetUrl) validateUrls(sourceUrl, targetUrl);

describe.skipIf(!sourceUrl || !targetUrl)("Lab 4 logical database and attachment recovery", () => {
  it("restores all application rows and attachment bytes into a separate disposable schema", async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "toktickit-lab4-recovery-"));
    const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
    const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });
    try {
      await prepareSchema(source, sourceUrl!, "lab4_recovery_source_test");
      await prepareSchema(target, targetUrl!, "lab4_recovery_target_test");
      await seedDatabase(source);

      const ticket = await source.ticket.findFirst({ where: { ownerId: { not: null } }, orderBy: { id: "asc" } });
      expect(ticket).not.toBeNull();
      const fixture = ticket!;
      const attachmentContent = Buffer.from("Lab 4 disposable recovery attachment evidence.\n", "utf8");
      const storageKey = randomUUID();
      const sourceFiles = path.join(tempDirectory, "source-attachments");
      const backupFiles = path.join(tempDirectory, "backup", "attachments");
      const restoredFiles = path.join(tempDirectory, "restored-attachments");
      await mkdir(sourceFiles, { recursive: true });
      await mkdir(backupFiles, { recursive: true });
      await mkdir(restoredFiles, { recursive: true });
      await writeFile(path.join(sourceFiles, storageKey), attachmentContent, { flag: "wx" });
      const attachment = await source.attachment.create({ data: {
        ticketId: fixture.id, storageKey, originalFilename: "recovery-evidence.txt",
        mimeType: "text/plain", sizeBytes: attachmentContent.length,
        removedAt: new Date("2026-09-25T10:00:00.000Z"), removedByRequesterId: fixture.requesterId,
        removalReason: "Historical soft removal remains attributed to the Requester.",
      } });
      await source.publicComment.create({ data: { ticketId: fixture.id, authorId: fixture.requesterId, content: "Public recovery fixture." } });
      await source.internalNote.create({ data: { ticketId: fixture.id, authorId: fixture.ownerId!, content: "Private recovery fixture." } });
      await source.ticketEvent.create({ data: {
        ticketId: fixture.id, actorId: fixture.ownerId!, type: "RECOVERY_FIXTURE",
        before: { status: "NEW" }, after: { status: fixture.currentStatus },
      } });

      // Capture every application table, not only the sampled Ticket. The
      // fixture uses separate paths for original, backup and restored bytes.
      const snapshot = await capture(source);
      const manifest = {
        counts: rowCounts(snapshot),
        ticket: { id: fixture.id, requesterId: fixture.requesterId, ownerId: fixture.ownerId,
          currentStatus: fixture.currentStatus, itPriority: fixture.itPriority },
        attachment: { id: attachment.id, ticketId: fixture.id, storageKey,
          removedByRequesterId: attachment.removedByRequesterId, sha256: digest(attachmentContent) },
      };
      const snapshotPath = path.join(tempDirectory, "backup", "database.json");
      const manifestPath = path.join(tempDirectory, "backup", "manifest.json");
      await writeFile(snapshotPath, JSON.stringify(snapshot));
      await writeFile(manifestPath, JSON.stringify(manifest));
      await copyFile(path.join(sourceFiles, storageKey), path.join(backupFiles, storageKey));

      const savedManifest = JSON.parse(await readFile(manifestPath, "utf8")) as typeof manifest;
      const savedSnapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as typeof snapshot;
      expect(digest(await readFile(path.join(backupFiles, storageKey)))).toBe(savedManifest.attachment.sha256);
      await restore(target, savedSnapshot);
      await copyFile(path.join(backupFiles, storageKey), path.join(restoredFiles, storageKey));

      expect(rowCounts(await capture(target))).toEqual(savedManifest.counts);
      const recoveredTicket = await target.ticket.findUnique({
        where: { id: savedManifest.ticket.id }, include: { requester: true, owner: true },
      });
      expect(recoveredTicket).toMatchObject(savedManifest.ticket);
      expect(recoveredTicket?.requester.id).toBe(savedManifest.ticket.requesterId);
      expect(recoveredTicket?.owner?.id).toBe(savedManifest.ticket.ownerId);
      expect(await target.attachment.findUnique({ where: { id: savedManifest.attachment.id } })).toMatchObject({
        ticketId: savedManifest.attachment.ticketId, storageKey: savedManifest.attachment.storageKey,
        removedByRequesterId: savedManifest.attachment.removedByRequesterId,
      });
      expect(digest(await readFile(path.join(restoredFiles, storageKey)))).toBe(savedManifest.attachment.sha256);
      expect(await target.actionTaken.count()).toBe(snapshot.actions.length);
      expect(await target.publicComment.count({ where: { ticketId: fixture.id } })).toBeGreaterThan(0);
      expect(await target.internalNote.count({ where: { ticketId: fixture.id } })).toBeGreaterThan(0);
      expect(await target.ticketEvent.count({ where: { ticketId: fixture.id } })).toBeGreaterThan(0);

      // Explicit IDs in a logical restore must not leave the next insert at 1.
      const nextCategory = await target.category.create({ data: { name: "Post-restore sequence check" } });
      expect(nextCategory.id).toBeGreaterThan(Math.max(...snapshot.categories.map(row => row.id)));
      console.log(`Lab 4 logical recovery verified ${snapshot.tickets.length} Tickets, ${snapshot.actions.length} Actions, ${snapshot.attachments.length} attachment metadata rows and the copied attachment SHA-256 in a separate local schema.`);
    } finally {
      await source.$disconnect();
      await target.$disconnect();
      const resolvedTemp = await realpath(os.tmpdir());
      const resolvedFixture = await realpath(tempDirectory);
      if (resolvedFixture.startsWith(`${resolvedTemp}${path.sep}`)
        && path.basename(resolvedFixture).startsWith("toktickit-lab4-recovery-")) {
        await rm(resolvedFixture, { recursive: true, force: true });
      }
    }
  }, 120_000);
});

function validateUrls(source: string | undefined, target: string | undefined) {
  if (!source || !target) throw new Error("Both dedicated Lab 4 recovery URLs are required.");
  const first = new URL(source);
  const second = new URL(target);
  for (const url of [first, second]) {
    if (!["postgresql:", "postgres:"].includes(url.protocol)
      || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error("Lab 4 recovery verification accepts only local PostgreSQL URLs.");
    }
  }
  if (first.searchParams.get("schema") !== "lab4_recovery_source_test"
    || second.searchParams.get("schema") !== "lab4_recovery_target_test"
    || first.origin !== second.origin || first.pathname !== second.pathname || first.username !== second.username) {
    throw new Error("Lab 4 recovery URLs must target two named disposable schemas in the same local database.");
  }
}

async function prepareSchema(database: PrismaClient, url: string, name: "lab4_recovery_source_test" | "lab4_recovery_target_test") {
  // name can only be one of the two literals checked above, never user input.
  await database.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${name}" CASCADE;`);
  await database.$executeRawUnsafe(`CREATE SCHEMA "${name}";`);
  const active = await database.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
  expect(active[0].schema).toBe(name);
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url }, stdio: "pipe",
  });
}

async function capture(database: PrismaClient) {
  return {
    categories: await database.category.findMany({ orderBy: { id: "asc" } }),
    users: await database.user.findMany({ orderBy: { id: "asc" } }),
    relatedSystems: await database.relatedSystem.findMany({ orderBy: { id: "asc" } }),
    tickets: await database.ticket.findMany({ orderBy: { id: "asc" } }),
    sessions: await database.session.findMany({ orderBy: { id: "asc" } }),
    attachments: await database.attachment.findMany({ orderBy: { id: "asc" } }),
    publicComments: await database.publicComment.findMany({ orderBy: { id: "asc" } }),
    internalNotes: await database.internalNote.findMany({ orderBy: { id: "asc" } }),
    ticketEvents: await database.ticketEvent.findMany({ orderBy: { id: "asc" } }),
    actions: await database.actionTaken.findMany({ orderBy: { id: "asc" } }),
    actionKeys: await database.actionTakenIdempotency.findMany({ orderBy: { id: "asc" } }),
  };
}

function rowCounts(snapshot: Awaited<ReturnType<typeof capture>>) {
  return Object.fromEntries(Object.entries(snapshot).map(([table, rows]) => [table, rows.length]));
}

async function restore(database: PrismaClient, snapshot: Awaited<ReturnType<typeof capture>>) {
  await database.category.createMany({ data: snapshot.categories });
  await database.user.createMany({ data: snapshot.users });
  await database.relatedSystem.createMany({ data: snapshot.relatedSystems });
  await database.ticket.createMany({ data: snapshot.tickets });
  await database.session.createMany({ data: snapshot.sessions });
  await database.attachment.createMany({ data: snapshot.attachments });
  await database.publicComment.createMany({ data: snapshot.publicComments });
  await database.internalNote.createMany({ data: snapshot.internalNotes });
  await database.ticketEvent.createMany({ data: snapshot.ticketEvents as unknown as Prisma.TicketEventCreateManyInput[] });
  await database.actionTaken.createMany({ data: snapshot.actions });
  await database.actionTakenIdempotency.createMany({ data: snapshot.actionKeys });

  for (const table of ["Category", "User", "RelatedSystem", "Ticket", "Session", "Attachment",
    "PublicComment", "InternalNote", "TicketEvent", "ActionTaken", "ActionTakenIdempotency"] as const) {
    await database.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT COUNT(*) > 0 FROM "${table}"))`);
  }
}

function digest(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}
