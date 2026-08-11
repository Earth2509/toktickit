# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test Description | Result |
|---|------|------------------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | PASSED |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | PASSED |
| 3 | Supertest | GET /api/tickets returns array of seeded tickets | PASSED |
| 4 | Supertest | POST /api/tickets validates missing required fields | PASSED |
| 5 | Supertest | POST /api/tickets creates a new ticket successfully | PASSED |
| 6 | Supertest | GET /api/tickets/:id returns single ticket detail | PASSED |
| 7 | Supertest | GET /api/tickets?categoryId=4 filters tickets by category | PASSED |
| 8 | Supertest | PATCH /api/tickets/:id/status updates ticket status | PASSED |
| 9 | Supertest | PATCH /api/tickets/:id/status rejects invalid status | PASSED |
| 10 | Vitest | TokTickIT heading renders | PASSED |
| 11 | Vitest | Success state shows Online + category list | PASSED |
| 12 | Vitest | Error state shows Offline + message | PASSED |
| 13 | Vitest | Renders ticket list title and ticket items | PASSED |
| 14 | Vitest | Opens create ticket modal when button clicked | PASSED |

## Passing Terminal Output Evidence

### Server Tests (`server/tests/lab-01/`)
```text
 RUN  v2.1.9 C:/Users/ASUS/Downloads/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-01/tickets.test.ts (7 tests)

 Test Files  3 passed (3)
      Tests  9 passed (9)
```

### Client Tests (`client/tests/lab-01/`)
```text
 RUN  v2.1.9 C:/Users/ASUS/Downloads/toktickit/client

 ✓ tests/lab-01/Tickets.test.tsx (2 tests)
 ✓ tests/lab-01/App.test.tsx (3 tests)

 Test Files  2 passed (2)
      Tests  5 passed (5)
```
