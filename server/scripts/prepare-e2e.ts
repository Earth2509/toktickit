import { execFileSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("E2E requires DATABASE_URL.");
}

const schema = new URL(databaseUrl).searchParams.get("schema");
if (schema !== "lab2_e2e") {
  throw new Error("E2E preparation only permits the dedicated lab2_e2e schema.");
}

const serverDirectory = path.resolve(import.meta.dirname, "..");
const prismaCli = path.join(serverDirectory, "node_modules", "prisma", "build", "index.js");

runPrisma(["generate"]);
runPrisma(["migrate", "reset", "--force", "--skip-generate"]);
runPrisma(["db", "seed"]);

function runPrisma(args: string[]) {
  execFileSync(process.execPath, [prismaCli, ...args], {
    cwd: serverDirectory,
    env: process.env,
    stdio: "inherit",
  });
}
