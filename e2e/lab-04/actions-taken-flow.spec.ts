import { expect, test } from "@playwright/test";
import { signIn } from "./support.js";

test("another Staff member can record and edit work without becoming the Ticket owner", async ({ page }) => {
  test.setTimeout(60_000);
  const ticketNumber = "TT-2026-000004";
  await signIn(page, "staff2@example.test", "Ticket Queue");
  await page.getByLabel("Search tickets").fill(ticketNumber);
  const row = page.getByRole("row").filter({ hasText: ticketNumber });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: ticketNumber })).toBeVisible();
  await expect(page.getByText(/Current owner:\s*Kamon IT Support/)).toBeVisible();

  await page.getByRole("button", { name: "Add action" }).click();
  await page.getByLabel("Action description").fill("Lalita checked the network path for the requester.");
  await page.getByRole("button", { name: "Save action" }).click();
  const actions = page.getByRole("list", { name: "Actions Taken" });
  const newAction = actions.getByRole("listitem").filter({ hasText: "Lalita checked the network path" });
  await expect(newAction).toContainText("Lalita IT Support");
  await newAction.getByRole("button", { name: "Edit action" }).click();
  await page.getByLabel("Action description").fill("Lalita checked the network path and documented the result.");
  await page.getByRole("button", { name: "Save action" }).click();
  await expect(actions).toContainText("Lalita checked the network path and documented the result.");
  await expect(page.getByText(/Current owner:\s*Kamon IT Support/)).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await signIn(page, "requester4@example.test", "My Tickets");
  await page.getByLabel("Search tickets").fill(ticketNumber);
  const ownedRow = page.getByRole("row").filter({ hasText: ticketNumber });
  await expect(ownedRow).toBeVisible();
  await ownedRow.getByRole("button", { name: "View details" }).click();
  await expect(page.getByRole("list", { name: "Actions Taken" })).toContainText("Lalita checked the network path and documented the result.");
  await expect(page.getByRole("button", { name: "Add action" })).toHaveCount(0);
});
