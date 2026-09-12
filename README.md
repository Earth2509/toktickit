# TokTickIT

TokTickIT is an IT service desk application. This repository is being built in four reviewed feature branches for CPE334 Lab 1.

## Foundation stack

- Client: React, TypeScript, Vite, Bootstrap
- Server: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Tests: Vitest, Supertest, React Testing Library

## Repository layout

```text
toktickit/
|- client/                 React + Vite frontend
|  |- src/
|  `- tests/
|- server/                 Express backend
|  |- prisma/              Prisma schema and future seed files
|  |- src/
|  `- tests/
|- docs/lab-01/            Lab evidence and records
|- .gitignore
`- README.md
```

## Setup

1. Install the dependencies separately for each application.

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Copy `server/.env.example` to `server/.env`, then set `DATABASE_URL` for a local PostgreSQL database. Do not commit `.env`.

3. Copy the remaining sample values in `server/.env.example`. Generate a unique
   local `AUTH_CSRF_SECRET`; do not commit it. To provision the documented Lab
   3 fixture users, retain `LAB3_SEED_MODE=local` and optionally override
   `LAB3_SEED_PASSWORD`. The local demo default is `Lab3-Demo-Only!2026` and
   every fixture account must change it after login. Fixture seeding is refused
   in production and never assigns a default password to migrated users.

4. Apply migrations and create local-only fixture data. The Lab 3 migration
   renames the existing `Requester` table to `User`; it does not delete or
   recreate user, Ticket, Attachment, or attachment-removal attribution rows.

   ```bash
   cd server
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Validate the Prisma configuration.

   ```bash
   cd server
   npm run prisma:validate
   ```

6. Run the development servers in separate terminals.

   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

The browser uses the same-origin `/api` path. Vite proxies it to
`http://localhost:3000` by default, so do not configure a browser-side API URL
or use a wildcard CORS policy. Set `VITE_API_PROXY_TARGET` only when testing a
different local API target.

The Lab 3 foundation provides `POST /api/auth/login`, `GET /api/auth/me`,
`POST /api/auth/change-password`, and `POST /api/auth/logout`. Login and every
browser mutation require an allowed Origin. Authenticated mutations also
require the `X-CSRF-Token` returned by login/me. The next Lab 3 feature moves
the existing Lab 2 ticket routes and frontend selector onto this session
identity.

## Test commands

```bash
cd server && npm test
cd client && npm test
```

## Integrated E2E checks

The root-level Playwright command starts the API and client itself. It creates
and resets only the dedicated PostgreSQL schema named `lab3_e2e`, applies the
committed migrations, reruns the idempotent seed, and uses an isolated runtime
attachment directory under `artifacts/`. No separately started development
server is required, and E2E records do not alter the normal application schema.

Before the first E2E run, install the root dependency and Chromium browser:

```bash
npm install
npm run e2e:install
```

The normal local database setup still applies: copy `server/.env.example` to
`server/.env` and set a working PostgreSQL `DATABASE_URL`. Then run:

```bash
npm run e2e
```

The suite performs real requester-owned ticket creation, requester switching,
Ticket Detail attachment lifecycle actions, and desktop/tablet/mobile visual
checks. HTML, trace, and responsive screenshot artifacts are written under
`artifacts/lab-02/` and are intentionally ignored by Git.

The foundation keeps the test commands ready. Feature-specific tests are added together with their corresponding functionality.
