import { expect, test } from "@playwright/test";

import { signUp, uniqueEmail } from "./helpers";

test("session persists across reload and sign-out removes access", async ({ page }) => {
  await signUp(page, uniqueEmail("logout"));

  await page.goto("/");
  await expect(page.getByRole("link", { name: /Open studio/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /Open studio/ })).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const session = await page.request.get("/api/auth/get-session");
  expect(session.ok()).toBeTruthy();
  expect(await session.json()).toBeNull();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Sign in" }),
  ).toBeVisible();
});
