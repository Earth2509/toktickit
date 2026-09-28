import { execFileSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
  throw new Error("Set DATABASE_URL in server/.env before running the Lab 4 migration test.");
}

const url = new URL(configuredUrl);
if (!["postgresql:", "postgres:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("Lab 4 migration test only accepts a local PostgreSQL DATABASE_URL.");
}

// The test itself verifies this exact schema name before any DROP SCHEMA.
// Never pass the normal application schema through to the destructive setup.
url.searchParams.set("schema", "lab4_migration_test");
const serverDirectory = process.cwd();
const vitestCli = path.join(serverDirectory, "node_modules", "vitest", "vitest.mjs");
console.log("Running against the disposable local lab4_migration_test schema; this schema will be reset.");
execFileSync(process.execPath, [vitestCli, "run", "tests/lab-04/migration-actions.integration.test.ts"], {
  cwd: serverDirectory,
  env: { ...process.env, NODE_ENV: "test", LAB4_MIGRATION_TEST_DATABASE_URL: url.toString() },
  stdio: "inherit",
});
