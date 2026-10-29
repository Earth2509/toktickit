import { expect, test } from "@playwright/test";
import { signIn } from "./support.js";

test("an open Action blocks resolution until Staff completes it; Requesters can only read it", async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page, "requester3@example.test", "My Tickets");
  await page.getByRole("button", { name: "Create Ticket" }).first().click();
  await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();
  await page.getByLabel("Requested Priority").selectOption("MEDIUM");
  await page.getByLabel("Category").selectOption({ index: 1 });
  await page.getByLabel("Related System").selectOption({ index: 1 });
  await page.getByLabel("Summary").fill("Lab 4 browser resolution gate evidence");
  await page.getByLabel("Description").fill("A new Ticket for testing the Action Taken and resolution workflow through the browser.");
  const createdResponse = page.waitForResponse(response => response.url().endsWith("/api/tickets") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Submit Ticket" }).click();
  const created = await (await createdResponse).json() as { id: number; ticketNumber: string };
  await expect(page.getByRole("heading", { name: "Your request has been created" })).toBeVisible();
  expect(created.ticketNumber).toMatch(/^TT-\d{4}-\d{6}$/);

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, "staff1@example.test", "Ticket Queue");
  await page.getByLabel("Search tickets").fill(created.ticketNumber);
  const row = page.getByRole("row").filter({ hasText: created.ticketNumber });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: created.ticketNumber })).toBeVisible();

  await page.getByRole("button", { name: "Claim Ticket" }).click();
  await expect(page.getByText(/Current owner:\s*Kamon IT Support/)).toBeVisible();
  await page.getByLabel("Next status").selectOption("OPEN");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.locator(".ticket-card-heading .status-badge")).toHaveText("OPEN");

  await page.getByRole("button", { name: "Add action" }).click();
  await page.getByLabel("Action description").fill("Investigated the reported service failure and applied the correction.");
  await page.getByRole("button", { name: "Save action" }).click();
  const actions = page.getByRole("list", { name: "Actions Taken" });
  const action = actions.getByRole("listitem").filter({ hasText: "Investigated the reported service failure" });
  await expect(action).toBeVisible();
  await expect(action).toContainText("OPEN");

  await page.getByLabel("Next status").selectOption("RESOLVED");
  await page.getByLabel("Resolution summary").fill("The service was validated after the configuration correction.");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByRole("alert")).toContainText("Complete or cancel every open Action Taken");
  await expect(page.locator(".ticket-card-heading .status-badge")).toHaveText("OPEN");

  await action.getByRole("button", { name: "Complete action" }).click();
  await page.getByLabel("Result").fill("The service is operating normally after validation.");
  await page.locator(".action-form").getByRole("button", { name: "Complete action" }).click();
  await expect(action).toContainText("COMPLETED");

  await page.getByLabel("Next status").selectOption("RESOLVED");
  await page.getByLabel("Resolution summary").fill("The corrected service passed validation and no follow-up remains.");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.locator(".ticket-card-heading .status-badge")).toHaveText("RESOLVED");
  await page.getByLabel("Next status").selectOption("CLOSED");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.locator(".ticket-card-heading .status-badge")).toHaveText("CLOSED");

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, "requester3@example.test", "My Tickets");
  await page.getByLabel("Search tickets").fill(created.ticketNumber);
  const ownedRow = page.getByRole("row").filter({ hasText: created.ticketNumber });
  await expect(ownedRow).toBeVisible();
  await ownedRow.getByRole("button", { name: "View details" }).click();
  await expect(page.getByRole("heading", { name: "Ticket Detail" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Actions Taken" })).toContainText("The service is operating normally after validation.");
  await expect(page.getByRole("button", { name: "Add action" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit action" })).toHaveCount(0);
  const denied = await page.evaluate(async ticketId => {
    const session = await (await fetch("/api/auth/me", { credentials: "same-origin" })).json() as { csrfToken: string };
    const response = await fetch(`/api/staff/tickets/${ticketId}/actions-taken`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), "X-CSRF-Token": session.csrfToken },
      body: JSON.stringify({ actionAt: new Date().toISOString(), description: "Forbidden requester action" }),
    });
    return response.status;
  }, created.id);
  expect(denied).toBe(403);
});
