import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import "dotenv/config";

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in server/.env before running the history check.");
const url = new URL(process.env.DATABASE_URL);
if (!["postgresql:", "postgres:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("History verification accepts only local PostgreSQL.");
}
// A fresh schema is created, never reset. The test drops only what it created.
const schema = `lab4_history_test_${randomBytes(6).toString("hex")}`;
url.searchParams.set("schema", schema);
console.log(`History verification uses a new disposable local schema: ${schema}. Public data is not modified.`);
execFileSync(process.execPath, [path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs"), "run", "tests/lab-04/workflow-history.integration.test.ts"], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "test", DATABASE_URL: url.toString(), LAB4_HISTORY_TEST_DATABASE_URL: url.toString() },
  stdio: "inherit",
});
