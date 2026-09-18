import { expect, test } from "@playwright/test";

test("same-origin proxy preserves the authentication cookie, Origin, CSRF, and logout revocation", async ({ page }) => {
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
