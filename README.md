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

The foundation keeps the test commands ready. Feature-specific tests are added together with their corresponding functionality.
