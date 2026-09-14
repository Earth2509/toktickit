import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: [
      // These Lab 2 API suites inject requesterId directly. Their business
      // behavior is covered by the authenticated Lab 3 authorization suite;
      // the identity-injection contract is deliberately retired.
      "tests/categories.test.ts",
      "tests/lab-02/development-requesters.api.test.ts",
      "tests/lab-02/create-ticket.api.test.ts",
      "tests/lab-02/my-tickets.api.test.ts",
      "tests/lab-02/attachments.api.test.ts",
    ],
  },
});
