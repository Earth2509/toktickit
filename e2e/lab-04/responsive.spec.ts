import { expect, test, type Page, type TestInfo } from "@playwright/test";

const ticketNumber = "TT-2026-000004";
const fixturePassword = "Lab3-Demo-Only!2026";
const privatePassword = "Lab3-E2E-Private!2026";

async function signIn(page: Page, email: string, landing: string) {
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

async function capture(page: Page, testInfo: TestInfo, viewport: string, screen: string) {
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow, `${screen} must not overflow horizontally at ${viewport} size`).toBeLessThanOrEqual(1);
  const screenshotPath = testInfo.outputPath("lab-04", viewport, `${screen}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`${screen}-${viewport}`, { path: screenshotPath, contentType: "image/png" });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Lab 4 dashboards and Action details fit ${viewport.name}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await signIn(page, "staff2@example.test", "Ticket Queue");
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^View \d+ .* Tickets$/ }).first()).toBeVisible();
    await capture(page, testInfo, viewport.name, "staff-dashboard");

    await page.getByRole("button", { name: "Ticket Queue" }).click();
    await page.getByLabel("Search tickets").fill(ticketNumber);
    const staffRow = page.getByRole("row").filter({ hasText: ticketNumber });
    await expect(staffRow).toBeVisible();
    await staffRow.getByRole("button", { name: "Open" }).click();
    await expect(page.getByRole("heading", { name: ticketNumber })).toBeVisible();
    await expect(page.getByRole("list", { name: "Actions Taken" })).toContainText("Replaced the affected configuration");
    await capture(page, testInfo, viewport.name, "staff-ticket-actions");

    await page.getByRole("button", { name: "Logout" }).click();
    await signIn(page, "requester4@example.test", "My Tickets");
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^View \d+ .* Tickets$/ }).first()).toBeVisible();
    await capture(page, testInfo, viewport.name, "requester-dashboard");

    await page.getByRole("button", { name: "My Tickets" }).first().click();
    await page.getByLabel("Search tickets").fill(ticketNumber);
    const requesterRow = page.getByRole("row").filter({ hasText: ticketNumber });
    await expect(requesterRow).toBeVisible();
    await requesterRow.getByRole("button", { name: "View details" }).click();
    await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Actions Taken" })).toContainText("Replaced the affected configuration");
    await capture(page, testInfo, viewport.name, "requester-ticket-actions");
  });
}
