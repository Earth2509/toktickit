import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Lab 3 browser evidence is deliberately isolated from the earlier Lab 2 run.
// The E2E database is always forced to the disposable `lab3_e2e` schema below.
const e2eRuntimeDirectory = path.resolve("artifacts/lab-03/e2e-runtime");
const e2eDatabaseUrl = isolatedE2eDatabaseUrl();
const e2eApiPort = process.env.E2E_API_PORT ?? "3001";
const e2eClientPort = process.env.E2E_CLIENT_PORT ?? "4173";
const reuseE2eServers = process.env.E2E_REUSE_SERVERS === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: "artifacts/lab-03/test-results",
  reporter: [["line"], ["html", { outputFolder: "artifacts/lab-03/playwright-report", open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${e2eClientPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run e2e:server --prefix server",
      url: `http://127.0.0.1:${e2eApiPort}/api/health`,
      timeout: 120_000,
      reuseExistingServer: reuseE2eServers,
      env: {
        ...process.env,
        PORT: e2eApiPort,
        DATABASE_URL: e2eDatabaseUrl,
        ATTACHMENT_STORAGE_DIR: path.join(e2eRuntimeDirectory, "uploads"),
        LAB3_SEED_MODE: "local",
        AUTH_CSRF_SECRET: "lab3-e2e-only-secret-not-for-production",
        TRUSTED_ORIGINS: `http://127.0.0.1:${e2eClientPort}`,
      },
    },
    {
      command: `npm run dev --prefix client -- --host 127.0.0.1 --port ${e2eClientPort}`,
      url: `http://127.0.0.1:${e2eClientPort}`,
      timeout: 120_000,
      reuseExistingServer: reuseE2eServers,
      env: {
        ...process.env,
        VITE_API_PROXY_TARGET: `http://127.0.0.1:${e2eApiPort}`,
      },
    },
  ],
});

function isolatedE2eDatabaseUrl() {
  const configuredUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? databaseUrlFromServerEnv();
  if (!configuredUrl) {
    throw new Error("E2E requires server/.env with DATABASE_URL, or an E2E_DATABASE_URL environment variable.");
  }

  const url = new URL(configuredUrl);
  url.searchParams.set("schema", "lab3_e2e");
  return url.toString();
}

function databaseUrlFromServerEnv() {
  const envPath = path.resolve("server/.env");
  if (!existsSync(envPath)) return undefined;

  const match = readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)["']?\s*$/m);
  return match?.[1];
}
