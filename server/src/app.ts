import express from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

export const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok", service: "TokTickIT API" }));

app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(503).json({ message: "Unable to load request categories" });
  }
});

app.get("/api/related-systems", async (_req, res) => {
  try {
    const relatedSystems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(relatedSystems);
  } catch {
    res.status(503).json({ message: "Unable to load related systems" });
  }
});

app.get("/api/requesters", async (_req, res) => {
  try {
    const requesters = await getPrisma().requester.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, email: true },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(503).json({ message: "Unable to load Development Requesters" });
  }
});

export default app;
