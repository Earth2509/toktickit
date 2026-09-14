import { createHash } from "node:crypto";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn().mockResolvedValue([
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 4, name: "Network" },
  { id: 3, name: "Software" },
]);
const sessionFindUnique = vi.fn();
const token = "categories-test-session";
const tokenHash = createHash("sha256").update(token).digest("base64url");
const user = {
  id: 1,
  displayName: "Authenticated Requester",
  email: "requester@example.test",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
  credentialVersion: 1,
};

vi.mock("../src/prisma.js", () => ({
  getPrisma: () => ({
    session: { findUnique: sessionFindUnique },
    category: { findMany },
  }),
}));

import { app } from "../src/app.js";

describe("GET /api/categories", () => {
  it("returns active categories in name order", async () => {
    sessionFindUnique.mockResolvedValue({
      tokenHash,
      userId: user.id,
      credentialVersion: user.credentialVersion,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });

    const response = await request(app)
      .get("/api/categories")
      .set("Cookie", `toktickit_session=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.map((category: { name: string }) => category.name)).toEqual([
      "Account and Access",
      "Hardware",
      "Network",
      "Software",
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});
