import { expect, test, type Page, type TestInfo } from "@playwright/test";

test("same-origin proxy preserves the authentication cookie, Origin, CSRF, and logout revocation", async ({ page }, testInfo) => {
  await page.goto("/");

  const login = await page.evaluate(async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "requester4@example.test",
        password: "Lab3-Demo-Only!2026",
      }),
    });
    return { status: response.status, body: await response.json() };
  });

  expect(login.status).toBe(200);
  expect(login.body).toMatchObject({
    user: { email: "requester4@example.test", role: "REQUESTER", mustChangePassword: true },
  });
  expect(login.body.csrfToken).toEqual(expect.any(String));

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Change your initial password" })).toBeVisible();
    await capturePublicScreen(page, testInfo, viewport.name, "mandatory-change-password");
  }

  const sessionCookie = (await page.context().cookies()).find((cookie) => cookie.name === "toktickit_session");
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax", secure: false });
  expect(await page.evaluate(() => document.cookie)).not.toContain("toktickit_session");

  const me = await page.evaluate(async () => {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    return { status: response.status, body: await response.json() };
  });
  expect(me).toMatchObject({ status: 200, body: { user: { email: "requester4@example.test" } } });

  const logoutStatus = await page.evaluate(async (csrfToken) => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRF-Token": csrfToken },
    });
    return response.status;
  }, login.body.csrfToken);
  expect(logoutStatus).toBe(204);

  const revokedStatus = await page.evaluate(async () => {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    return response.status;
  });
  expect(revokedStatus).toBe(401);
});

async function capturePublicScreen(page: Page, testInfo: TestInfo, viewport: string, screen: string) {
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  const screenshotPath = testInfo.outputPath("lab-03", viewport, `${screen}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`${screen}-${viewport}`, { path: screenshotPath, contentType: "image/png" });
}
