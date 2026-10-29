import { expect, type Page } from "@playwright/test";

const fixturePassword = "Lab3-Demo-Only!2026";
const privatePassword = "Lab3-E2E-Private!2026";

export async function signIn(page: Page, email: string, landing: string) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(privatePassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  const error = page.getByRole("alert");
  const passwordGate = page.getByRole("heading", { name: "Change your initial password" });
  const landingHeading = page.getByRole("heading", { name: landing });
  await expect(error.or(passwordGate).or(landingHeading)).toBeVisible();
  if (await error.isVisible()) {
    await page.getByLabel("Password").fill(fixturePassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(passwordGate.or(landingHeading)).toBeVisible();
  }
  if (await passwordGate.isVisible()) {
    await page.getByLabel("Current password").fill(fixturePassword);
    await page.getByLabel("New password", { exact: true }).fill(privatePassword);
    await page.getByLabel("Confirm new password").fill(privatePassword);
    await page.getByRole("button", { name: "Save password" }).click();
  }
  await expect(landingHeading).toBeVisible();
}
