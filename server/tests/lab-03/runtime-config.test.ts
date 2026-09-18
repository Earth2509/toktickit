import { describe, expect, it } from "vitest";
import { validateRuntimeConfiguration } from "../../src/runtime-config.js";

describe("Lab 3 runtime configuration", () => {
  it("names every missing authentication startup variable", () => {
    expect(() => validateRuntimeConfiguration({})).toThrow(
      "Missing required environment variables: DATABASE_URL, AUTH_CSRF_SECRET. See server/.env.example.",
    );
  });

  it("accepts a complete runtime configuration", () => {
    expect(() =>
      validateRuntimeConfiguration({
        DATABASE_URL: "postgresql://local.test/database",
        AUTH_CSRF_SECRET: "test-only-secret",
      }),
    ).not.toThrow();
  });
});
