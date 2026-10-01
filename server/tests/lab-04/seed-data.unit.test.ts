import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { seedDatabase } from "../../prisma/seed-data.js";

vi.mock("../../src/auth.js", () => ({ hashPassword: vi.fn().mockResolvedValue("local-test-hash") }));

describe("Lab 4 repeat-safe Action seed", () => {
  it("stores the fixture key only in the idempotency record and does not duplicate Actions", async () => {
    const keys = new Set<string>();
    const actionCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      expect(data).not.toHaveProperty("key");
      return { id: actionCreate.mock.calls.length };
    });
    const transaction = {
      actionTaken: { create: actionCreate },
      actionTakenIdempotency: {
        findUnique: vi.fn(async ({ where }: { where: { actorId_ticketId_key: { key: string } } }) =>
          keys.has(where.actorId_ticketId_key.key) ? { id: 1 } : null),
        create: vi.fn(async ({ data }: { data: { key: string } }) => {
          keys.add(data.key);
          return { id: keys.size };
        }),
      },
    };
    const prisma = {
      category: {
        upsert: vi.fn(),
        findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
      },
      relatedSystem: {
        upsert: vi.fn(),
        findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
      },
      user: {
        upsert: vi.fn(),
        findMany: vi.fn(async ({ where }: { where: { role: string } }) =>
          where.role === "REQUESTER" ? [{ id: 1 }] : [{ id: 6 }, { id: 7 }]),
      },
      ticket: {
        upsert: vi.fn(),
        findMany: vi.fn().mockResolvedValue([{ id: 2 }, { id: 3 }, { id: 4 }]),
      },
      $transaction: vi.fn(async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };

    const previousMode = process.env.LAB3_SEED_MODE;
    process.env.LAB3_SEED_MODE = "local";
    try {
      await seedDatabase(prisma as unknown as PrismaClient);
      await seedDatabase(prisma as unknown as PrismaClient);
    } finally {
      if (previousMode === undefined) delete process.env.LAB3_SEED_MODE;
      else process.env.LAB3_SEED_MODE = previousMode;
    }

    expect(actionCreate).toHaveBeenCalledTimes(3);
    expect(transaction.actionTakenIdempotency.create).toHaveBeenCalledTimes(3);
    expect(keys).toEqual(new Set(["lab4-seed-action-1", "lab4-seed-action-2", "lab4-seed-action-3"]));
  });
});
