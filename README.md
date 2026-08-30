# TokTickIT - Lab 1

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

3. Validate the Prisma configuration.

   ```bash
   cd server
   npm run prisma:validate
   ```

4. Run the development servers in separate terminals.

   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

The health endpoint, category schema/seed, API routes, and interactive UI are delivered in the following feature branches.

## Test commands

```bash
cd server && npm test
cd client && npm test
```

## Lab 2 integrated E2E checks

The root-level Playwright command starts the API and client itself. It creates
and resets only the dedicated PostgreSQL schema named `lab2_e2e`, applies the
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
