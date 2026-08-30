import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const e2eRuntimeDirectory = path.resolve("artifacts/lab-02/e2e-runtime");
const e2eDatabaseUrl = isolatedE2eDatabaseUrl();

export default defineConfig({
  testDir: "./e2e/lab-02",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: "artifacts/lab-02/test-results",
  reporter: [["line"], ["html", { outputFolder: "artifacts/lab-02/playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run e2e:server --prefix server",
      url: "http://127.0.0.1:3001/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        PORT: "3001",
        DATABASE_URL: e2eDatabaseUrl,
        ATTACHMENT_STORAGE_DIR: path.join(e2eRuntimeDirectory, "uploads"),
      },
    },
    {
      command: "npm run dev --prefix client -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        VITE_API_URL: "http://127.0.0.1:3001",
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
  url.searchParams.set("schema", "lab2_e2e");
  return url.toString();
}

function databaseUrlFromServerEnv() {
  const envPath = path.resolve("server/.env");
  if (!existsSync(envPath)) return undefined;

  const match = readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)["']?\s*$/m);
  return match?.[1];
}
