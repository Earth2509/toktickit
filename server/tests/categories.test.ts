import request from "supertest";
import { describe, expect, it, vi } from "vitest";
vi.mock("../src/prisma.js", () => ({ getPrisma: () => ({ category: { findMany: vi.fn().mockResolvedValue([{id:1,name:"Account and Access"},{id:2,name:"Hardware"},{id:3,name:"Software"},{id:4,name:"Network"}]) } }) }));
import { app } from "../src/app.js";
describe("GET /api/categories",()=>it("returns categories in ID order",async()=>{const r=await request(app).get("/api/categories");expect(r.status).toBe(200);expect(r.body.map((c:{name:string})=>c.name)).toEqual(["Account and Access","Hardware","Software","Network"]);}));
