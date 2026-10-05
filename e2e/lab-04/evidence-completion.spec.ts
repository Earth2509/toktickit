import { expect, test, type Page, type TestInfo } from "@playwright/test";

// Only run through the standard runner: its server forces the disposable lab3_e2e schema.
// Response fixtures below prove rendering, not authoritative database counts or backend denial.
const initialPassword = "Lab3-Demo-Only!2026";
const changedPassword = "Lab3-E2E-Private!2026";
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 820, height: 1180 }); });

async function signIn(page: Page, email: string, landing: string) {
  await page.goto("/");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(changedPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const gate = page.getByRole("heading", { name: "Change your initial password" });
  const destination = page.getByRole("heading", { name: landing, exact: true });
  const error = page.getByRole("alert");
  await expect(gate.or(destination).or(error)).toBeVisible();
  if (await error.isVisible()) {
    await page.getByLabel("Password", { exact: true }).fill(initialPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(gate.or(destination)).toBeVisible();
  }
  if (await gate.isVisible()) {
    await page.getByLabel("Current password").fill(initialPassword);
    await page.getByLabel("New password", { exact: true }).fill(changedPassword);
    await page.getByLabel("Confirm new password").fill(changedPassword);
    await page.getByRole("button", { name: "Save password", exact: true }).click();
  }
  await expect(destination).toBeVisible();
}

async function capture(page: Page, info: TestInfo, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const path = info.outputPath("evidence-completion", name + ".png");
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Evidence completion: final Action keyboard and edit-submitting checklist at ${viewport.name}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await signIn(page, "staff1@example.test", "Ticket Queue");
    await page.getByLabel("Search tickets").fill("TT-2026-000002");
    await page.getByRole("row").filter({ hasText: "TT-2026-000002" }).getByRole("button", { name: "Open", exact: true }).click();
    const add = page.getByRole("button", { name: "Add action", exact: true });
    await add.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(/^Action date and time/)).toBeFocused();
    const description = page.getByLabel(/^Action description/);
    const labelAudit = await page.locator('.action-form input, .action-form select, .action-form textarea').evaluateAll(elements =>
      elements.every(element => (element as HTMLInputElement).labels?.length),
    );
    expect(labelAudit).toBe(true);
    await page.getByRole("button", { name: "Save action", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(description).toBeFocused();
    await expect(description).toHaveAttribute("aria-invalid", "true");
    await expect(description).toHaveAttribute("aria-describedby", "action-form-error");
    const fixture = `Disposable keyboard evidence ${viewport.name}`;
    await page.keyboard.type(fixture);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Follow-up required", { exact: true })).toBeFocused();
    await page.keyboard.press("Space");
    await page.keyboard.press("Tab");
    const note = page.getByLabel(/^Follow-up note/);
    await expect(note).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Attachment notes", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(note).toBeFocused();
    await expect(note).toHaveAttribute("aria-invalid", "true");
    await capture(page, info, `action-keyboard-follow-up-validation-${viewport.name}`);
    await page.keyboard.type("Verify the diagnostic result after one business day.");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    const item = page.locator('.action-item').filter({ has: page.getByRole("heading", { name: fixture, exact: true }) });
    await expect(item).toBeVisible();
    await expect(item.locator('.action-status')).toHaveText("OPEN");
    const edit = item.getByRole("button", { name: "Edit action", exact: true });
    await edit.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(/^Assignee/)).toBeFocused();
    await expect(page.getByLabel(/^Action date and time/)).toBeDisabled();
    await page.keyboard.press("Tab");
    await expect(description).toBeFocused();
    expect(await description.evaluate(element => {
      const style = getComputedStyle(element);
      return element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    })).toBe(true);
    const draft = fixture + " - preserved edit draft";
    await description.fill(draft);
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/staff/tickets/*/actions-taken/*", async route => {
      if (route.request().method() !== "PATCH") return route.continue();
      await pending;
      await route.fulfill({ status: 409, contentType: "application/json", json: { message: "Controlled stale Action evidence; no edit persisted." } });
    });
    await page.getByRole("button", { name: "Save action", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('.action-form')).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("button", { name: "Saving action...", exact: true })).toBeDisabled();
    await expect(description).toBeDisabled();
    await expect(page.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await capture(page, info, `action-edit-submitting-controlled-${viewport.name}`);
    release();
    await expect(page.getByRole("alert").filter({ hasText: "This Action changed" })).toBeFocused();
    await expect(description).toHaveValue(draft);
    await expect(page.locator('.action-form')).toHaveAttribute("aria-busy", "false");
    await capture(page, info, `action-edit-conflict-preserved-draft-${viewport.name}`);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Save action", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(edit).toBeFocused();
    await expect(item.getByRole("heading", { name: fixture, exact: true })).toBeVisible();
    await expect(item.getByRole("heading", { name: draft, exact: true })).toHaveCount(0);
  });

  test(`Evidence completion: keyboard drill-down and long Action rendering at ${viewport.name}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await signIn(page, "staff2@example.test", "Ticket Queue");
    await page.getByRole("button", { name: "Dashboard", exact: true }).click();
    const metrics = page.locator(".dashboard-metric");
    await expect(metrics).toHaveCount(4);
    await metrics.nth(0).focus();
    await page.keyboard.press("Tab");
    await expect(metrics.nth(1)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(metrics.nth(0)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Ticket Queue", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ticket Queue", exact: true }).click();
    await page.getByLabel("Search tickets").fill("TT-2026-000004");
    // Controlled display fixture, not persisted work or a backend mutation.
    const longDescription = "Controlled wrapping evidence: " + "Diagnostic findings and recovery observations. ".repeat(18);
    const longToken = "reference-" + "abcdefghij".repeat(35);
    await page.route(url => /^\/api\/tickets\/\d+\/actions-taken$/.test(url.pathname), async route => {
      const original = await route.fetch();
      const body = await original.json();
      expect(body.items.length).toBeGreaterThan(0);
      body.items[0] = { ...body.items[0], description: longDescription, result: longToken,
        followUpRequired: true, followUpNote: longDescription, attachmentNotes: longToken };
      await route.fulfill({ response: original, json: body });
    });
    await page.getByRole("row").filter({ hasText: "TT-2026-000004" }).getByRole("button", { name: "Open", exact: true }).click();
    const actions = page.getByRole("list", { name: "Actions Taken" });
    await expect(actions).toContainText(longDescription);
    await expect(actions).toContainText(longToken);
    const clipped = await page.locator(".action-item h3, .action-metadata dd").evaluateAll(elements =>
      elements.filter(element => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
        .map(element => element.tagName + ": " + element.textContent?.slice(0, 50)),
    );
    expect(clipped, "Action prose and unbroken references must remain fully wrapped").toEqual([]);
    await capture(page, info, `long-action-controlled-render-${viewport.name}`);
  });
}

test("Evidence completion: Staff loading, controlled empty and controlled forbidden render safely", async ({ page }, info) => {
  test.setTimeout(90_000);
  await signIn(page, "staff1@example.test", "Ticket Queue");
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/staff/dashboard", async route => { await pending; await route.continue(); });
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByText("Loading Dashboard...", { exact: true })).toBeVisible();
  await expect(page.locator('.dashboard-loading')).toHaveAttribute('aria-busy', 'true');
  await capture(page, info, "staff-dashboard-loading-delayed-real-request");
  release();
  await expect(page.getByRole("heading", { name: "Actions Taken by me" })).toBeVisible();
  await page.unroute("**/api/staff/dashboard");
  await page.getByRole("button", { name: "Ticket Queue", exact: true }).click();
  await page.route("**/api/staff/dashboard", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({
      metrics: { unassignedTickets: 0, ownedByMe: 0, urgentTickets: 0, waitingForRequester: 0 },
      recentTickets: [], totalPerformedActions: 0, recentActions: [],
    }),
  }));
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByText("There is no operational work right now.")).toBeVisible();
  await expect(page.getByText("You have not recorded any Actions Taken yet.")).toBeVisible();
  await capture(page, info, "staff-dashboard-empty-controlled-response");
  await page.unroute("**/api/staff/dashboard");
  await page.getByRole("button", { name: "Ticket Queue", exact: true }).click();
  await page.route("**/api/staff/dashboard", route => route.fulfill({
    status: 403, contentType: "application/json", body: JSON.stringify({ code: "FORBIDDEN", message: "Forbidden." }),
  }));
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("You are not permitted to view this Dashboard.");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
  await expect(page.locator('.dashboard-metric')).toHaveCount(0);
  await capture(page, info, "staff-dashboard-forbidden-controlled-response");
});

test("Evidence completion: pending Action save disables controls and preserves draft after controlled failure", async ({ page }, info) => {
  test.setTimeout(90_000);
  await signIn(page, "staff1@example.test", "Ticket Queue");
  await page.getByLabel("Search tickets").fill("TT-2026-000002");
  await page.getByRole("row").filter({ hasText: "TT-2026-000002" }).getByRole("button", { name: "Open", exact: true }).click();
  await page.getByRole("button", { name: "Add action", exact: true }).click();
  const draft = "Evidence-only unsaved draft: retain these diagnostic findings after a recoverable failure.";
  await page.getByLabel(/^Action description/).fill(draft);
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/staff/tickets/*/actions-taken", async route => {
    if (route.request().method() !== "POST") return route.continue();
    await pending;
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Controlled evidence-only save failure. Please retry." }) });
  });
  await page.getByRole("button", { name: "Save action", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saving action...", exact: true })).toBeDisabled();
  await expect(page.getByLabel(/^Action description/)).toBeDisabled();
  await capture(page, info, "action-submitting-controlled-pending-save");
  release();
  await expect(page.getByRole("alert")).toContainText("Controlled evidence-only save failure");
  await expect(page.getByLabel(/^Action description/)).toHaveValue(draft);
  await expect(page.getByRole("button", { name: "Save action", exact: true })).toBeEnabled();
  await capture(page, info, "action-controlled-failure-preserves-draft");
});

test("Evidence completion: seeded Requester attention drill-down and real API ownership denial", async ({ page }, info) => {
  test.setTimeout(90_000);
  await signIn(page, "requester4@example.test", "My Tickets");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  const response = await page.request.get("/api/requester/dashboard");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.metrics.waitingForRequester).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: `View ${data.metrics.waitingForRequester} waiting for you Tickets`, exact: true })).toBeVisible();
  await capture(page, info, "requester-seeded-attention-dashboard");
  const listResponse = page.waitForResponse(r => r.url().includes("/api/tickets?") && r.url().includes("currentStatus=WAITING_FOR_REQUESTER"));
  await page.getByRole("button", { name: `View ${data.metrics.waitingForRequester} waiting for you Tickets`, exact: true }).click();
  expect((await (await listResponse).json()).totalItems).toBe(data.metrics.waitingForRequester);
  await capture(page, info, "requester-seeded-attention-drilldown");
  const forbidden = await page.request.get("/api/staff/dashboard");
  expect(forbidden.status()).toBe(403);
  const others = await page.request.get("/api/tickets/1");
  expect(others.status()).toBe(404);
  await info.attach("real-requester-role-and-ownership-denial", { body: JSON.stringify({
    provenance: "Real HTTP responses in disposable lab3_e2e; not route-fulfilled responses.",
    staffDashboard: { status: forbidden.status(), body: await forbidden.json() },
    otherRequesterTicket: { status: others.status(), body: await others.json() },
  }, null, 2), contentType: "application/json" });
});

test("Evidence completion: real inactive-assignee rejection and non-performer controls", async ({ page }, info) => {
  test.setTimeout(90_000);
  // Administrator's default landing screen is User Management, not Staff Queue.
  await signIn(page, "admin@example.test", "User Management");
  const users = await (await page.request.get("/api/admin/users?search=staff-inactive%40example.test")).json();
  const inactive = users.items.find((user: { email: string }) => user.email === "staff-inactive@example.test");
  expect(inactive?.isActive).toBe(false);
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await signIn(page, "staff3@example.test", "Ticket Queue");
  await page.getByLabel("Search tickets").fill("TT-2026-000004");
  // Both Staff and Requester detail views use the shared GET /api/tickets/:id.
  // /api/staff/tickets/:id is reserved for mutation routes, not detail reads.
  const detailResponse = page.waitForResponse(r =>
    r.request().method() === "GET" && /^\/api\/tickets\/\d+$/.test(new URL(r.url()).pathname),
    { timeout: 10_000 },
  );
  await page.getByRole("row").filter({ hasText: "TT-2026-000004" }).getByRole("button", { name: "Open", exact: true }).click();
  const detail = await detailResponse;
  expect(detail.status()).toBe(200);
  const ticket = await detail.json();
  expect(ticket.ticketNumber).toBe("TT-2026-000004");
  await expect(page.getByRole("heading", { name: ticket.ticketNumber, exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Actions Taken" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit action", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Complete action", exact: true })).toHaveCount(0);
  await capture(page, info, "staff-non-performer-non-assignee-readonly-existing-action");
  const denied = await page.evaluate(async ({ ticketId, assignedToId }) => {
    const session = await (await fetch("/api/auth/me")).json();
    const result = await fetch(`/api/staff/tickets/${ticketId}/actions-taken`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken, "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ actionAt: new Date().toISOString(), description: "Rejected inactive-assignee evidence, never stored.", assignedToId, followUpRequired: false }),
    });
    return { status: result.status, body: await result.json() };
  }, { ticketId: ticket.id, assignedToId: inactive.id });
  expect(denied.status).toBe(422);
  await info.attach("real-inactive-assignee-api-rejection", { body: JSON.stringify(denied, null, 2), contentType: "application/json" });
});
