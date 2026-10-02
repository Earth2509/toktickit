import { expect, test, type Page } from "@playwright/test";

const initialPassword = "Lab3-Demo-Only!2026";
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
    await page.getByLabel("Password").fill(initialPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(passwordGate.or(landingHeading)).toBeVisible();
  }
  if (await passwordGate.isVisible()) {
    await page.getByLabel("Current password").fill(initialPassword);
    await page.getByLabel("New password", { exact: true }).fill(privatePassword);
    await page.getByLabel("Confirm new password").fill(privatePassword);
    await page.getByRole("button", { name: "Save password" }).click();
  }
  await expect(landingHeading).toBeVisible();
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Requester and Staff dashboards drill down at ${viewport.name} size`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await signIn(page, "requester3@example.test", "My Tickets");
    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const requesterData = await page.evaluate(async () => (await fetch("/api/requester/dashboard", { credentials: "same-origin" })).json());
    const requesterCount = requesterData.metrics.openTickets as number;
    await expect(page.getByRole("button", { name: `View ${requesterCount} total open Tickets` })).toBeVisible();
    const ownList = page.waitForResponse(response => response.url().includes("/api/tickets?") && response.url().includes("currentStatus=NEW%2COPEN%2CIN_PROGRESS%2CREOPENED"));
    await page.getByRole("button", { name: `View ${requesterCount} total open Tickets` }).click();
    expect((await (await ownList).json()).totalItems).toBe(requesterCount);
    await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
    await page.getByRole("button", { name: "Logout" }).click();

    await signIn(page, "staff1@example.test", "Ticket Queue");
    await page.getByRole("button", { name: "Dashboard" }).click();
    const staffData = await page.evaluate(async () => (await fetch("/api/staff/dashboard", { credentials: "same-origin" })).json());
    const ownedCount = staffData.metrics.ownedByMe as number;
    await expect(page.getByRole("button", { name: `View ${ownedCount} owned by me Tickets` })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions Taken by me" })).toBeVisible();
    const ownActions = page.getByRole("region", { name: "Actions Taken by me" });
    expect(staffData.recentActions.length).toBeLessThanOrEqual(5);
    await expect(ownActions.getByText(`Showing the latest ${staffData.recentActions.length} of ${staffData.totalPerformedActions} Actions.`, { exact: false })).toBeVisible();
    if (staffData.recentActions.length === 0) {
      await expect(ownActions.getByText("You have not recorded any Actions Taken yet.")).toBeVisible();
    } else {
      const action = staffData.recentActions[0];
      await expect(ownActions.getByText(action.description, { exact: true })).toBeVisible();
      await ownActions.getByRole("button", { name: `View Ticket ${action.ticket.ticketNumber} for Action ${action.id}`, exact: true }).click();
      await expect(page.getByRole("heading", { name: action.ticket.ticketNumber, exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Dashboard", exact: true }).click();
      await expect(page.getByRole("button", { name: `View ${ownedCount} owned by me Tickets` })).toBeVisible();
    }
    const ownedList = page.waitForResponse(response => response.url().includes("/api/staff/tickets?") && response.url().includes("owner=me"));
    await page.getByRole("button", { name: `View ${ownedCount} owned by me Tickets` }).click();
    expect((await (await ownedList).json()).totalItems).toBe(ownedCount);
    await expect(page.getByRole("heading", { name: "Ticket Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Users" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
