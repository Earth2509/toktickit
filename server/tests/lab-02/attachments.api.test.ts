import { createHash, createHmac } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  ticketFindFirst,
  attachmentFindFirst,
  attachmentFindMany,
  attachmentCount,
  attachmentCreate,
  attachmentUpdate,
  mkdir,
  writeFile,
  readFile,
  unlink,
  sessionFindUnique,
} = vi.hoisted(() => ({
  ticketFindFirst: vi.fn(),
  attachmentFindFirst: vi.fn(),
  attachmentFindMany: vi.fn(),
  attachmentCount: vi.fn(),
  attachmentCreate: vi.fn(),
  attachmentUpdate: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  sessionFindUnique: vi.fn(),
}));

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    ticket: { findFirst: ticketFindFirst },
    attachment: {
      findFirst: attachmentFindFirst,
      findMany: attachmentFindMany,
      count: attachmentCount,
      create: attachmentCreate,
      update: attachmentUpdate,
    },
  }),
}));

vi.mock("node:fs/promises", () => ({ mkdir, writeFile, readFile, unlink }));

import { app } from "../../src/app.js";

const token = "attachments-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const csrfSecret = "attachments-test-secret";
const csrf = createHmac("sha256", csrfSecret).update(tokenHash).digest("base64url");
const user = {
  id: 1,
  displayName: "Authenticated Requester",
  email: "requester@example.test",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
  credentialVersion: 1,
};

function getAsRequester(pathname: string) {
  return request(app).get(pathname).set("Cookie", `toktickit_session=${token}`);
}

function postAsRequester(pathname: string) {
  return request(app)
    .post(pathname)
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf);
}

function patchAsRequester(pathname: string) {
  return request(app)
    .patch(pathname)
    .set("Cookie", `toktickit_session=${token}`)
    .set("Origin", "http://localhost:5173")
    .set("X-CSRF-Token", csrf);
}

const activeAttachment = {
  id: 8,
  originalFilename: "network-proof.png",
  mimeType: "image/png",
  sizeBytes: 42,
  createdAt: new Date("2026-08-29T08:00:00.000Z"),
  removedAt: null,
  removedByRequesterId: null,
  removalReason: null,
};
const pngFile = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdfFile = Buffer.from("%PDF-1.7\\n");

describe("Ticket detail and attachment routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_CSRF_SECRET = csrfSecret;
    process.env.TRUSTED_ORIGINS = "http://localhost:5173";
    sessionFindUnique.mockResolvedValue({
      tokenHash,
      userId: user.id,
      credentialVersion: user.credentialVersion,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    ticketFindFirst.mockResolvedValue({ id: 42, currentStatus: "NEW" });
    attachmentCount.mockResolvedValue(0);
    attachmentCreate.mockResolvedValue(activeAttachment);
    attachmentFindMany.mockResolvedValue([activeAttachment]);
    attachmentFindFirst.mockResolvedValue({
      ...activeAttachment,
      storageKey: "safe-storage-key",
      ticket: { currentStatus: "NEW" },
    });
    attachmentUpdate.mockResolvedValue({
      ...activeAttachment,
      removedAt: new Date("2026-08-29T09:00:00.000Z"),
      removedByRequesterId: 1,
      removalReason: "Duplicate screenshot",
    });
    mkdir.mockResolvedValue(undefined);
    writeFile.mockResolvedValue(undefined);
    readFile.mockResolvedValue(Buffer.from("attachment data"));
    unlink.mockResolvedValue(undefined);
  });

  it("returns a detail representation only when the Ticket belongs to the selected Requester", async () => {
    const detail = {
      id: 42,
      ticketNumber: "TT-2026-000042",
      requesterId: 1,
      summary: "Network drops during lectures",
      description: "The wireless connection disconnects repeatedly during afternoon lectures.",
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      category: { id: 2, name: "Network" },
      relatedSystem: { id: 3, name: "Campus Wi-Fi" },
      requester: { id: 1, displayName: "Anan Chaiyasit", email: "anan@example.test" },
      attachments: [activeAttachment],
    };
    ticketFindFirst.mockResolvedValueOnce(detail);

    const response = await getAsRequester("/api/tickets/42");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ticketNumber: "TT-2026-000042", attachments: [{ id: 8, removedAt: null }] });
    expect(ticketFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 42, requesterId: 1 } }));

    ticketFindFirst.mockResolvedValueOnce(null);
    const crossOwner = await getAsRequester("/api/tickets/42");
    expect(crossOwner.status).toBe(404);
    expect(crossOwner.body).toEqual({ message: "Ticket not found." });
  });

  it("stores valid attachment metadata for an owned Ticket without exposing a storage path", async () => {
    const response = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", pngFile, { filename: "network-proof.png", contentType: "image/png" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 8, originalFilename: "network-proof.png", mimeType: "image/png", removedAt: null });
    expect(response.body).not.toHaveProperty("storageKey");
    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining("uploads"), pngFile, { flag: "wx" });
  });

  it("rejects unsupported or oversized files and a sixth active attachment before creating metadata", async () => {
    const unsupported = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", Buffer.from("notes"), { filename: "notes.txt", contentType: "text/plain" });

    expect(unsupported.status).toBe(415);
    expect(unsupported.body).toEqual({ message: "Only JPEG, PNG, WEBP, and PDF files are supported." });
    expect(attachmentCreate).not.toHaveBeenCalled();

    const oversized = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), { filename: "oversized.png", contentType: "image/png" });

    expect(oversized.status).toBe(413);
    expect(oversized.body).toEqual({ message: "Each attachment must be 5 MB or smaller." });
    expect(attachmentCreate).not.toHaveBeenCalled();

    attachmentFindMany.mockResolvedValueOnce([
      { activeSlot: 1 }, { activeSlot: 2 }, { activeSlot: 3 }, { activeSlot: 4 }, { activeSlot: 5 },
    ]);
    const sixth = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", pdfFile, { filename: "proof.pdf", contentType: "application/pdf" });

    expect(sixth.status).toBe(409);
    expect(sixth.body).toEqual({ message: "A Ticket can have no more than five active attachments." });
    expect(attachmentCreate).not.toHaveBeenCalled();
  });

  it("accepts at most five concurrent uploads by retrying a database slot collision", async () => {
    const occupiedSlots = new Set<number>();
    attachmentFindMany.mockImplementation(async () => [...occupiedSlots].map((activeSlot) => ({ activeSlot })));
    attachmentCreate.mockImplementation(async ({ data }: { data: { activeSlot: number } }) => {
      if (occupiedSlots.has(data.activeSlot)) {
        throw Object.assign(new Error("duplicate active slot"), { code: "P2002", meta: { target: ["ticketId", "activeSlot"] } });
      }
      occupiedSlots.add(data.activeSlot);
      return activeAttachment;
    });

    const responses = await Promise.all(Array.from({ length: 6 }, () => postAsRequester("/api/tickets/42/attachments")
      .attach("file", pngFile, { filename: "network-proof.png", contentType: "image/png" })));

    expect(responses.map((response) => response.status).sort()).toEqual([201, 201, 201, 201, 201, 409]);
    expect([...occupiedSlots].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not disclose or attach files to a Ticket owned by another Requester", async () => {
    ticketFindFirst.mockResolvedValueOnce(null);

    const response = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", pdfFile, { filename: "proof.pdf", contentType: "application/pdf" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Ticket not found." });
    expect(attachmentCount).not.toHaveBeenCalled();
    expect(attachmentCreate).not.toHaveBeenCalled();
  });

  it("returns only owned attachment metadata and downloads active owned files", async () => {
    const metadata = await getAsRequester("/api/tickets/42/attachments");
    expect(metadata.status).toBe(200);
    expect(metadata.body).toHaveLength(1);
    expect(metadata.body[0]).not.toHaveProperty("storageKey");

    const download = await getAsRequester("/api/tickets/42/attachments/8/download");
    expect(download.status).toBe(200);
    expect(download.headers["content-disposition"]).toContain("network-proof.png");
    expect(Buffer.from(download.body).toString()).toBe("attachment data");
  });

  it("soft-removes an owned active attachment, records a trimmed reason, and blocks repeat removal", async () => {
    attachmentFindFirst.mockResolvedValueOnce({ id: 8, removedAt: null, ticket: { currentStatus: "NEW" } });
    const removed = await patchAsRequester("/api/tickets/42/attachments/8/remove")
      .send({ reason: "  Duplicate screenshot  " });

    expect(removed.status).toBe(200);
    expect(attachmentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 8 },
      data: expect.objectContaining({ removedByRequesterId: 1, removalReason: "Duplicate screenshot" }),
    }));

    attachmentFindFirst.mockResolvedValueOnce({
      id: 8,
      removedAt: new Date("2026-08-29T09:00:00.000Z"),
      ticket: { currentStatus: "NEW" },
    });
    const repeated = await patchAsRequester("/api/tickets/42/attachments/8/remove")
      .send({ reason: "Duplicate screenshot" });
    expect(repeated.status).toBe(409);
  });

  it("rejects uploads and removals when a Ticket is closed or cancelled", async () => {
    ticketFindFirst.mockResolvedValueOnce({ id: 42, currentStatus: "CLOSED" });
    const upload = await postAsRequester("/api/tickets/42/attachments")
      .attach("file", pngFile, { filename: "network-proof.png", contentType: "image/png" });

    expect(upload.status).toBe(409);
    expect(upload.body).toEqual({ code: "CONFLICT", message: "Attachments cannot be uploaded in this Ticket status." });
    expect(attachmentCreate).not.toHaveBeenCalled();

    attachmentFindFirst.mockResolvedValueOnce({ id: 8, removedAt: null, ticket: { currentStatus: "CANCELLED" } });
    const removal = await patchAsRequester("/api/tickets/42/attachments/8/remove")
      .send({ reason: "No longer needed" });

    expect(removal.status).toBe(409);
    expect(removal.body).toEqual({ code: "CONFLICT", message: "Attachments cannot be removed in this Ticket status." });
    expect(attachmentUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 for an unexpected attachment failure and 503 only when the database is unavailable", async () => {
    ticketFindFirst.mockRejectedValueOnce(new Error("unexpected"));
    const unexpectedFailure = await getAsRequester("/api/tickets/42");
    expect(unexpectedFailure.status).toBe(500);

    ticketFindFirst.mockRejectedValueOnce(Object.assign(new Error("database unavailable"), { code: "P1001" }));
    const dependencyFailure = await getAsRequester("/api/tickets/42");
    expect(dependencyFailure.status).toBe(503);
  });
});
