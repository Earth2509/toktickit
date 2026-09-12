import type { PrismaClient } from "@prisma/client";
import { hashPassword, normalizeEmail, validateNewPassword } from "./auth.js";

export async function provisionMigratedUser(
  prisma: PrismaClient,
  emailValue: unknown,
  passwordValue: unknown,
) {
  const email = normalizeEmail(emailValue);
  if (!email) throw new Error("Enter a valid user email address.");

  const passwordError = validateNewPassword(passwordValue);
  if (passwordError) throw new Error(passwordError);
  const password = passwordValue as string;
  const passwordHash = await hashPassword(password);

  const result = await prisma.user.updateMany({
    where: { email, passwordHash: null },
    data: {
      passwordHash,
      mustChangePassword: true,
      credentialVersion: { increment: 1 },
    },
  });

  if (result.count === 1) return { email };

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });
  if (!existing) throw new Error("No migrated user has that email address.");
  throw new Error("Credentials already exist; provisioning will not overwrite them.");
}
