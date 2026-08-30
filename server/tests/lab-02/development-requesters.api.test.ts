import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requesterFindMany = vi.fn();
const relatedSystemFindMany = vi.fn();

vi.mock("../../src/prisma.js", () => ({
  getPrisma: () => ({
    requester: { findMany: requesterFindMany },
    relatedSystem: { findMany: relatedSystemFindMany },
  }),
}));

import { app } from "../../src/app.js";

describe("Lab 2 active reference APIs", () => {
  beforeEach(() => {
    requesterFindMany.mockReset();
    relatedSystemFindMany.mockReset();
  });

  it("returns only active Development Requesters in display-name order", async () => {
    requesterFindMany.mockResolvedValue([
      { id: 1, displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local" },
      { id: 2, displayName: "Busaba Wattanakul", email: "busaba.wattanakul@toktickit.local" },
    ]);

    const response = await request(app).get("/api/requesters");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).not.toHaveProperty("isActive");
    expect(requesterFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, email: true },
    });
  });

  it("returns a safe error when Requester data is unavailable", async () => {
    requesterFindMany.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get("/api/requesters");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Unable to load Development Requesters" });
  });

  it("returns active Related Systems in name order", async () => {
    relatedSystemFindMany.mockResolvedValue([{ id: 1, name: "Campus Wi-Fi" }]);

    const response = await request(app).get("/api/related-systems");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: "Campus Wi-Fi" }]);
    expect(relatedSystemFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});
