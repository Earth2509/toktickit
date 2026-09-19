import { expect, test, type Page, type TestInfo } from "@playwright/test";

const fixturePassword = "Lab3-Demo-Only!2026";
const privatePassword = "Lab3-E2E-Private!2026";

const accounts = {
  requester: { email: "requester3@example.test", name: "Chanin Rattanakul", landing: "My Tickets" },
  otherRequester: { email: "requester2@example.test", name: "Busaba Wattanakul", landing: "My Tickets" },
  staff: { email: "staff1@example.test", name: "Kamon IT Support", landing: "Ticket Queue" },
  staffWithoutAdminAccess: { email: "staff2@example.test", name: "Lalita IT Support", landing: "Ticket Queue" },
  admin: { email: "admin@example.test", name: "System Administrator", landing: "User Management" },
} as const;

const fixtureTicket = "TT-2026-000003";

test("Requester indication, Staff discussion, and note privacy work through the browser", async ({ page }) => {
  await signIn(page, accounts.requester);
  await openRequesterTicket(page, fixtureTicket);

  await page.getByLabel("Upload an attachment").setInputFiles({
    name: "e2e-owner-only-evidence.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
  });
  await expect(page.getByText("e2e-owner-only-evidence.pdf was uploaded successfully.")).toBeVisible();
  const protectedResource = await page.evaluate(async () => {
    const response = await fetch("/api/tickets?search=TT-2026-000003", { credentials: "same-origin" });
    const body = await response.json();
    const ticket = body.items?.find((item: { ticketNumber: string }) => item.ticketNumber === "TT-2026-000003");
    if (!ticket) throw new Error("Fixture Ticket was not returned for its owner.");
    const detail = await (await fetch(`/api/tickets/${ticket.id}`, { credentials: "same-origin" })).json();
    const attachment = detail.attachments?.find((item: { originalFilename: string }) => item.originalFilename === "e2e-owner-only-evidence.pdf");
    if (!attachment) throw new Error("Owner attachment was not returned.");
    return { ticketId: ticket.id as number, attachmentId: attachment.id as number };
  });

  await page.getByRole("button", { name: "Indicate problem appears resolved" }).click();
  await expect(page.getByText("Your indication was recorded. IT Staff will review the Ticket status.")).toBeVisible();
  await page.getByRole("textbox", { name: "Public comment", exact: true }).fill("Requester E2E public discussion evidence.");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.getByText("Requester E2E public discussion evidence.")).toBeVisible();

  await signOut(page);
  await signIn(page, accounts.staff);
  await openStaffTicket(page, fixtureTicket);

  await expect(page.getByText(/Requester reports the problem appears resolved: Chanin Rattanakul/)).toBeVisible();
  await page.getByRole("button", { name: "Claim Ticket" }).click();
  await expect(page.getByText(/Current owner:\s*Kamon IT Support/)).toBeVisible();

  await page.getByRole("textbox", { name: "Public comment", exact: true }).fill("Staff E2E public reply.");
  await page.getByRole("button", { name: "Post comment" }).click();
  await expect(page.getByText("Staff E2E public reply.")).toBeVisible();

  await page.getByRole("textbox", { name: "Internal note", exact: true }).fill("Staff E2E private-note evidence.");
  await page.getByRole("button", { name: "Add internal note" }).click();
  await expect(page.getByText("Staff E2E private-note evidence.")).toBeVisible();

  await signOut(page);
  await signIn(page, accounts.requester);
  await openRequesterTicket(page, fixtureTicket);
  await expect(page.getByText("Staff E2E public reply.")).toBeVisible();
  await expect(page.getByText("Staff E2E private-note evidence.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Internal notes" })).toHaveCount(0);

  await signOut(page);
  await signIn(page, accounts.otherRequester);
  const denial = await page.evaluate(async ({ ticketId, attachmentId }) => {
    const [ticket, attachment] = await Promise.all([
      fetch(`/api/tickets/${ticketId}`, { credentials: "same-origin" }),
      fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`, { credentials: "same-origin" }),
    ]);
    return { ticket: ticket.status, attachment: attachment.status };
  }, protectedResource);
  expect(denial).toEqual({ ticket: 404, attachment: 404 });
});

test("Administrator creates and resets a user while IT Staff is denied the Users API and screen", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const displayName = `E2E Evidence User ${suffix}`;
  const email = `e2e-evidence-${suffix}@example.test`;
  const initialPassword = "E2E Initial Password!2026";
  const resetPassword = "E2E Reset Password!2026";

  await signIn(page, accounts.admin);
  await page.getByRole("button", { name: "Create User" }).click();
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Role").last().selectOption("REQUESTER");
  await page.getByLabel("Initial password").fill(initialPassword);
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  await expect(page.getByText("User account created. The user must change the initial password at next login.")).toBeVisible();

  await page.getByLabel("Search name or email").fill(email);
  await page.getByRole("button", { name: "Search" }).click();
  const userRow = page.getByRole("row").filter({ hasText: email });
  await expect(userRow).toContainText(displayName);
  await userRow.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Initial password").fill(resetPassword);
  await page.getByRole("button", { name: "Set new initial password" }).click();
  await expect(page.getByText("Initial password reset. Existing sessions were revoked and the user must change this password at next login.")).toBeVisible();

  await signOut(page);
  await signIn(page, accounts.staffWithoutAdminAccess);
  await expect(page.getByRole("button", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "User Management" })).toHaveCount(0);
  const denial = await page.evaluate(async () => {
    const response = await fetch("/api/admin/users", { credentials: "same-origin" });
    return { status: response.status, body: await response.json() };
  });
  expect(denial).toMatchObject({ status: 403, body: { code: "FORBIDDEN" } });

  await signOut(page);
  await signIn(page, { email, name: displayName, landing: "My Tickets" }, resetPassword, { expectMandatoryPasswordGate: true });
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`major authenticated screens have no horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeVisible();
    await capture(page, testInfo, viewport.name, "login");

    await signIn(page, accounts.requester);
    await capture(page, testInfo, viewport.name, "requester-my-tickets");
    await page.getByRole("button", { name: "Create Ticket" }).first().click();
    await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();
    await capture(page, testInfo, viewport.name, "requester-create-ticket");
    await page.getByRole("button", { name: "My Tickets" }).first().click();
    await openRequesterTicket(page, fixtureTicket);
    await capture(page, testInfo, viewport.name, "requester-ticket-detail");
    await signOut(page);

    await signIn(page, accounts.staff);
    await capture(page, testInfo, viewport.name, "staff-queue");
    await openStaffTicket(page, fixtureTicket);
    await capture(page, testInfo, viewport.name, "staff-ticket-detail");
    await signOut(page);

    await signIn(page, accounts.admin);
    await capture(page, testInfo, viewport.name, "user-management");
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByRole("heading", { name: "Create User" })).toBeVisible();
    await capture(page, testInfo, viewport.name, "user-management-create");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    const administratorRow = page.getByRole("row").filter({ hasText: accounts.admin.email });
    await expect(administratorRow).toBeVisible();
    await administratorRow.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: `Edit ${accounts.admin.name}` })).toBeVisible();
    await capture(page, testInfo, viewport.name, "user-management-edit");
  });
}

type SignInOptions = { expectMandatoryPasswordGate?: boolean };

async function signIn(
  page: Page,
  account: { email: string; name: string; landing: string },
  initial = fixturePassword,
  options: SignInOptions = {},
) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeVisible();

  // A resettable E2E schema may have been run before. Prefer the private password
  // persisted by that prior run, then deliberately fall back to the documented
  // fixture password when a fresh seed requires its first password change.
  let activePassword = privatePassword;
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password").fill(activePassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  const signInFailure = page.getByRole("alert");
  const passwordGate = page.getByRole("heading", { name: "Change your initial password" });
  const landing = page.getByRole("heading", { name: account.landing });
  await expect(signInFailure.or(passwordGate).or(landing)).toBeVisible();

  if (await signInFailure.isVisible()) {
    activePassword = initial;
    await page.getByLabel("Password").fill(activePassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(passwordGate.or(landing)).toBeVisible();
  }

  if (options.expectMandatoryPasswordGate) {
    // This assertion intentionally happens before the helper completes the gate.
    // It fails if an Admin reset ever stops setting mustChangePassword.
    await expect(passwordGate).toBeVisible();
  }

  if (await passwordGate.isVisible()) {
    await page.getByLabel("Current password").fill(activePassword);
    await page.getByLabel("New password", { exact: true }).fill(privatePassword);
    await page.getByLabel("Confirm new password").fill(privatePassword);
    await page.getByRole("button", { name: "Save password" }).click();
  }

  await expect(landing).toBeVisible();
  await expect(page.getByText(account.name).first()).toBeVisible();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeVisible();
}

async function openRequesterTicket(page: Page, ticketNumber: string) {
  await page.getByLabel("Search tickets").fill(ticketNumber);
  const row = page.getByRole("row").filter({ hasText: ticketNumber });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "View details" }).click();
  await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
}

async function openStaffTicket(page: Page, ticketNumber: string) {
  await page.getByLabel("Search tickets").fill(ticketNumber);
  const row = page.getByRole("row").filter({ hasText: ticketNumber });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: ticketNumber })).toBeVisible();
}

async function capture(page: Page, testInfo: TestInfo, viewport: string, screen: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const screenshotPath = testInfo.outputPath("lab-03", viewport, `${screen}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`${screen}-${viewport}`, { path: screenshotPath, contentType: "image/png" });
}
