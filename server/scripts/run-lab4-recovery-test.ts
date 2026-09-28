import { execFileSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) throw new Error("Set DATABASE_URL in server/.env before running Lab 4 recovery verification.");
const source = new URL(configuredUrl);
if (!["postgresql:", "postgres:"].includes(source.protocol)
  || !["localhost", "127.0.0.1", "[::1]"].includes(source.hostname)) {
  throw new Error("Lab 4 recovery verification accepts only a local PostgreSQL DATABASE_URL.");
}

const target = new URL(source);
source.searchParams.set("schema", "lab4_recovery_source_test");
target.searchParams.set("schema", "lab4_recovery_target_test");
const serverDirectory = process.cwd();
const vitestCli = path.join(serverDirectory, "node_modules", "vitest", "vitest.mjs");
console.log("Resetting only the disposable local lab4_recovery_source_test and lab4_recovery_target_test schemas.");
execFileSync(process.execPath, [vitestCli, "run", "tests/lab-04/migration-recovery.integration.test.ts"], {
  cwd: serverDirectory,
  env: {
    ...process.env,
    NODE_ENV: "test",
    LAB3_SEED_MODE: "local",
    LAB4_RECOVERY_SOURCE_URL: source.toString(),
    LAB4_RECOVERY_TARGET_URL: target.toString(),
  },
  stdio: "inherit",
});
