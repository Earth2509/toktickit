import { expect, test, type Page, type TestInfo } from "@playwright/test";

const requesterA = "Aree Chaiyasit";
const requesterB = "Busaba Wattanakul";
const requesterEmails: Record<string, string> = {
  [requesterA]: "requester1@example.test",
  [requesterB]: "requester2@example.test",
};
const initialPassword = "Lab3-Demo-Only!2026";
const privatePassword = "Lab3-E2E-Private!2026";

test("Requester can create, find, inspect, and soft-remove a real attachment", async ({ page }) => {
  const summary = uniqueSummary("Attachment lifecycle");

  await chooseRequester(page, requesterA);
  await openCreateTicket(page);
  await completeTicketForm(page, summary);
  await openTicketDetail(page, summary);

  await page.getByLabel("Upload an attachment").setInputFiles({
    name: "e2e-evidence.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
  });
  await expect(page.getByText("e2e-evidence.pdf was uploaded successfully.")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("e2e-evidence.pdf");

  await page.getByRole("button", { name: "Remove" }).click();
  await page.getByLabel("Removal reason").fill("E2E validation completed");
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText(/Removed.*E2E validation completed/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download" })).toHaveCount(0);
});

test("Authenticated Requester sessions keep the integrated ticket list owner-scoped", async ({ page }) => {
  const summary = uniqueSummary("Requester ownership");

  await chooseRequester(page, requesterA);
  await openCreateTicket(page);
  await completeTicketForm(page, summary);

  await page.getByRole("button", { name: "Logout" }).click();
  await signInRequester(page, requesterB);
  await page.getByLabel("Search tickets").fill(summary);

  await expect(page.getByText("No Tickets match your search or filters.")).toBeVisible();
  await expect(page.getByText(summary, { exact: true })).toHaveCount(0);
});

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Requester screens remain usable at ${viewport.name} width`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const summary = uniqueSummary(`Responsive ${viewport.name}`);

    await chooseRequester(page, requesterA);
    await openCreateTicket(page);
    await captureResponsiveEvidence(page, testInfo, viewport.name, "create-ticket");

    await completeTicketForm(page, summary);
    await captureResponsiveEvidence(page, testInfo, viewport.name, "my-tickets");

    await page.getByRole("row").filter({ hasText: summary }).getByRole("button", { name: "View details" }).click();
    await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
    await captureResponsiveEvidence(page, testInfo, viewport.name, "ticket-detail");
  });
}

async function chooseRequester(page: Page, requesterName: string) {
  await page.goto("/");
  await signInRequester(page, requesterName);
}

async function signInRequester(page: Page, requesterName: string) {
  const email = requesterEmails[requesterName];
  if (!email) throw new Error(`No E2E account is configured for ${requesterName}.`);
  await expect(page.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(privatePassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  const loginError = page.getByRole("alert");
  const passwordChange = page.getByRole("heading", { name: "Change your initial password" });
  const myTickets = page.getByRole("heading", { name: "My Tickets" });
  await expect(loginError.or(passwordChange).or(myTickets)).toBeVisible();
  if (await loginError.isVisible()) {
    await page.getByLabel("Password").fill(initialPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(passwordChange.or(myTickets)).toBeVisible();
  }

  if (await passwordChange.isVisible()) {
    await page.getByLabel("Current password").fill(initialPassword);
    await page.getByLabel("New password", { exact: true }).fill(privatePassword);
    await page.getByLabel("Confirm new password").fill(privatePassword);
    await page.getByRole("button", { name: "Save password" }).click();
  }

  await expect(myTickets).toBeVisible();
  await expect(page.getByText(requesterName).first()).toBeVisible();
}

async function openCreateTicket(page: Page) {
  await page.getByRole("button", { name: "Create Ticket" }).first().click();
  await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();
  await expect(page.getByLabel("Category")).toBeEnabled();
}

async function completeTicketForm(page: Page, summary: string) {
  await page.getByLabel("Requested Priority").selectOption("HIGH");
  await page.getByLabel("Category").selectOption({ label: "Account and Access" });
  await page.getByLabel("Related System").selectOption({ label: "Email" });
  await page.getByLabel("Summary").fill(summary);
  await page.getByLabel("Description").fill("This Ticket is created by the integrated Playwright requester flow.");
  await page.getByRole("button", { name: "Submit Ticket" }).click();

  const successPanel = page.locator(".success-panel");
  await expect(successPanel).toContainText(/TT-\d{4}-\d{6}/);
  await page.getByRole("button", { name: "View My Tickets" }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await page.getByLabel("Search tickets").fill(summary);
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
}

async function openTicketDetail(page: Page, summary: string) {
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
  await page.getByRole("row").filter({ hasText: summary }).getByRole("button", { name: "View details" }).click();
  await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
  await expect(page.getByText(summary, { exact: true })).toBeVisible();
}

async function captureResponsiveEvidence(page: Page, testInfo: TestInfo, viewport: string, screen: string) {
  await expectNoHorizontalOverflow(page);
  const screenshotPath = testInfo.outputPath("responsive", viewport, `${screen}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`${screen}-${viewport}`, { path: screenshotPath, contentType: "image/png" });
}

async function expectNoHorizontalOverflow(page: Page) {
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
}

function uniqueSummary(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
