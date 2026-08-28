import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn().mockResolvedValue([
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 4, name: "Network" },
  { id: 3, name: "Software" },
]);

vi.mock("../src/prisma.js", () => ({ getPrisma: () => ({ category: { findMany } }) }));

import { app } from "../src/app.js";

describe("GET /api/categories", () => {
  it("returns active categories in name order", async () => {
    const response = await request(app).get("/api/categories");

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
