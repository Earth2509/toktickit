import express from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

export const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "TokTickIT API" }));
app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await getPrisma().category.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } });
    res.status(200).json(categories);
  } catch {
    res.status(503).json({ message: "Unable to load request categories" });
  }
});
export default app;
