import { expect, test } from "@playwright/test";

import { signUp, uniqueEmail } from "./helpers";

test("billing shows current credits but no Artora purchase action in P1", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("billing"));
  await page.goto("/billing");
  await expect(
    page.getByRole("heading", { name: "Billing & credits" }),
  ).toBeVisible();
  await expect(page.getByText("Payments not open yet")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /upgrade|buy top-up/i }),
  ).toHaveCount(0);
});
