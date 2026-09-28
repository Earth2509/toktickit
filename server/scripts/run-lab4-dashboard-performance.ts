import { execFileSync } from "node:child_process";
import path from "node:path";
import "dotenv/config";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
  throw new Error("Set DATABASE_URL in server/.env before running the Lab 4 dashboard performance smoke test.");
}

const url = new URL(configuredUrl);
if (!["postgresql:", "postgres:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("Lab 4 dashboard performance smoke accepts only a local PostgreSQL DATABASE_URL.");
}

// The test independently checks this exact name before dropping any schema.
url.searchParams.set("schema", "lab4_dashboard_perf_test");
const serverDirectory = process.cwd();
const vitestCli = path.join(serverDirectory, "node_modules", "vitest", "vitest.mjs");
console.log("Running against disposable local lab4_dashboard_perf_test; this schema will be reset.");
execFileSync(process.execPath, [vitestCli, "run", "tests/lab-04/dashboard-performance.smoke.test.ts"], {
  cwd: serverDirectory,
  env: {
    ...process.env,
    NODE_ENV: "test",
    LAB3_SEED_MODE: "local",
    DATABASE_URL: url.toString(),
    LAB4_PERFORMANCE_TEST_DATABASE_URL: url.toString(),
  },
  stdio: "inherit",
});
