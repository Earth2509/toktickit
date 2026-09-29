# TokTickIT

TokTickIT is a full-stack IT service desk built through reviewed CPE334 Lab 1-4 increments. Requesters create and follow their own Tickets; IT Staff coordinate Tickets and record Actions Taken; Administrators manage users and can perform Staff work. The Lab 4 dashboards summarize the same authoritative Ticket data without replacing the detailed views.

## Stack and repository layout

- `client/`: React, TypeScript and Vite UI; Vitest and React Testing Library tests.
- `server/`: Express API, Prisma/PostgreSQL schema and migrations, seed, Vitest/Supertest tests.
- `e2e/`: Playwright browser regression and responsive checks.
- `docs/lab-01/` through `docs/lab-04/`: specifications, test plans, review records and submission evidence.
- `docs/lab-04/evidence/`: twelve committed desktop, tablet and mobile screenshots of the major Lab 4 screens.
- `artifacts/`: local Playwright reports, traces and runtime files; ignored by Git.

## Local setup

Use a local PostgreSQL database. From the repository root, install each package's locked dependencies:

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
```

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`, a unique `AUTH_CSRF_SECRET`, and the trusted browser origins for your local ports. Keep `.env` out of Git. The example file documents the optional Lab 3 fixture and migrated-user provisioning settings.

Apply the committed migrations, then run the repeat-safe local seed:

```bash
npm --prefix server run prisma:validate
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

The Lab 3 migration preserves existing User, Ticket and Attachment relationships, and the Lab 4 migration adds Actions Taken without deleting earlier records. The seed adds local-only fixture accounts and Tickets with zero, one or multiple Actions. It requires `LAB3_SEED_MODE=local`, refuses production, and does not duplicate seeded Actions on rerun. Migrated users receive no default password; see `server/.env.example` for the guarded one-time provisioning command.

Start the API and UI in separate terminals:

```bash
npm --prefix server run dev
npm --prefix client run dev
```

The UI normally opens at `http://localhost:5173`. Vite proxies same-origin `/api` requests to `http://localhost:3000`; set `VITE_API_PROXY_TARGET` only if your local API uses another port. Sign in with an active local fixture account: `requester1@example.test`, `staff1@example.test`, or `admin@example.test`. The fixture password is the local seed value in `server/prisma/seed-data.ts` or your `LAB3_SEED_PASSWORD` override. Fixture users must change the initial password on first sign-in. Do not use these accounts or passwords in production.

## Demonstration path

1. As a Requester, open Dashboard, drill down to My Tickets, create a Ticket, then inspect its status, public discussion, attachments and read-only Actions Taken.
2. As IT Staff, open Dashboard and Ticket Queue, claim a Ticket, create or complete an Action Taken, and observe the resolution-gate feedback and updated Ticket status. A second Staff member can record a separate Action without becoming the primary Ticket Owner.
3. As an Administrator, inspect the Staff dashboard and Users screen. Verify that inactive accounts and role restrictions remain enforced by the API, not merely by hidden UI controls.
4. Inspect each role's loading, empty, validation and safe-error feedback, and the desktop/tablet/mobile layouts. The committed evidence and any remaining manual-inspection limits are listed in `docs/lab-04/ui-spec.md`.

## Verification

Run the default server and client suites and production builds from the repository root:

```bash
npm --prefix server test
npm --prefix client test
npm --prefix server run build
npm --prefix client run build
```

The default server run intentionally skips database-resetting integration, recovery and performance suites. To run the guarded Lab 4 checks against *disposable local PostgreSQL schemas*, first verify your `server/.env` points to a local database, then run each separately:

```bash
npm --prefix server run test:lab4-migration
npm --prefix server run test:lab4-recovery
npm --prefix server run test:lab4-performance
```

The scripts reset only their named test schemas (`lab4_migration_test`, `lab4_recovery_source_test`, `lab4_recovery_target_test`, and `lab4_dashboard_perf_test`). They must not be used as a production backup or performance benchmark. `docs/lab-04/tests.md` records the separate results and their limits.

The root Playwright command starts its own API and UI and **resets the disposable `lab3_e2e` schema** before seeding it. Stop any local servers on the configured E2E ports first. With a working local PostgreSQL `DATABASE_URL` in `server/.env`, run:

```bash
npm run e2e:install
npm run e2e
```

Playwright covers Lab 2/3 regressions and Lab 4 Action, dashboard, workflow and responsive scenarios. Its HTML report is written to `artifacts/lab-03/playwright-report/`; the twelve Lab 4 responsive evidence images are committed under `docs/lab-04/evidence/`. Run final verification again **after** the reviewed staging branch is promoted to `main`; feature-branch results alone do not establish a passing final `main`.

## Security and data handling

Authentication uses an HTTP-only session cookie. Browser mutations require an allowed Origin and CSRF token. Requester ownership, Staff/Admin permissions, Action assignment, concurrency conflicts and Ticket resolution rules are enforced on the server. Never commit `server/.env`, real credentials, database dumps, private attachments or local `artifacts/` output.
