import { describe, expect, it } from "vitest";
import { hashPassword, validateNewPassword, verifyPassword } from "../../src/auth.js";

describe("Lab 3 password primitives", () => {
  it("stores a versioned scrypt hash and verifies only the original password", async () => {
    const passwordHash = await hashPassword("Long enough local password");

    expect(passwordHash).toMatch(/^scrypt\$1\$32768\$8\$3\$/);
    await expect(verifyPassword("Long enough local password", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("A different local password", passwordHash)).resolves.toBe(false);
  });

  it("applies the documented Unicode-aware password policy without trimming input", () => {
    expect(validateNewPassword("short")).toBe("Use 12 to 128 characters.");
    expect(validateNewPassword("            ")).toBe("The password cannot contain only whitespace.");
    expect(validateNewPassword("รหัสผ่านทดสอบ123")).toBeUndefined();
    expect(validateNewPassword("x".repeat(129))).toBe("Use 12 to 128 characters.");
  });

  it("rejects malformed or unsupported stored hash formats safely", async () => {
    await expect(verifyPassword("Long enough local password", "plaintext-password")).resolves.toBe(false);
    await expect(verifyPassword("Long enough local password", "scrypt$1$1024$8$3$bad$bad")).resolves.toBe(false);
  });
});
