# Lab 1 - Test Results

All Lab 1 automated tests pass on lab1-staging and are included in the release PR to main.

| ID | Feature branch | Tool | Test description | Status |
|---|---|---|---|---|
| API-01 | feature/2-health-check | Supertest | GET /api/health returns 200 and the expected JSON | Passed |
| API-02 | feature/4-category-list | Supertest | GET /api/categories returns the four seeded categories in ID order | Passed |
| UI-01 | feature/2-health-check | Vitest | TokTickIT heading renders | Passed |
| UI-02 | feature/4-category-list | Vitest | Loading state changes to the category list | Passed |
| UI-03 | feature/2-health-check | Vitest | API failure displays a useful error message without exposing a browser network error | Passed |

## Terminal evidence

    client
    ✓ tests/App.test.tsx (3 tests)
    Test Files  1 passed (1)
    Tests  3 passed (3)

    server
    ✓ tests/categories.test.ts (1 test)
    ✓ tests/health.test.ts (1 test)
    Test Files  2 passed (2)
    Tests  2 passed (2)

The client suite covers UI-01 through UI-03. The server suite covers API-01 and API-02.
