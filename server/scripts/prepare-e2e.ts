import { execFileSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("E2E requires DATABASE_URL.");
}

const schema = new URL(databaseUrl).searchParams.get("schema");
if (schema !== "lab3_e2e") {
  throw new Error("E2E preparation only permits the dedicated lab3_e2e schema.");
}

// This script runs from dist/scripts after the TypeScript build.
const serverDirectory = path.resolve(import.meta.dirname, "../..");
const prismaCli = path.join(serverDirectory, "node_modules", "prisma", "build", "index.js");

if (process.env.E2E_SKIP_PRISMA_GENERATE !== "true") {
  runPrisma(["generate"]);
}
runPrisma(["migrate", "reset", "--force", "--skip-generate", "--skip-seed"]);
runSeed();

function runPrisma(args: string[]) {
  execFileSync(process.execPath, [prismaCli, ...args], {
    cwd: serverDirectory,
    env: process.env,
    stdio: "inherit",
  });
}

function runSeed() {
  const compiledSeed = path.join(serverDirectory, "dist", "prisma", "seed.js");
  execFileSync(process.execPath, [compiledSeed], {
    cwd: serverDirectory,
    env: process.env,
    stdio: "inherit",
  });
}
