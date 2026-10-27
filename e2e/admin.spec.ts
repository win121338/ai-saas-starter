import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import { E2E_DATABASE_URL } from "../playwright.config";
import { signUp, uniqueEmail } from "./helpers";

test("admin console is restricted and publishes a versioned style template", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);

  const email = uniqueEmail("admin");
  await signUp(page, email);
  const denied = await page.goto("/admin");
  expect(denied?.status()).toBe(404);

  const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  try {
    const user = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    expect(user.rows).toHaveLength(1);
    await pool.query(
      "INSERT INTO admin_members (user_id, role) VALUES ($1, 'admin')",
      [user.rows[0].id],
    );
  } finally {
    await pool.end();
  }

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin console" }),
  ).toBeVisible();
  await page.goto("/admin/orders");
  await expect(
    page.getByText("Stripe is not configured for this environment."),
  ).toBeVisible();

  await page.goto("/admin/templates?style=clay-portrait");
  await page
    .getByRole("textbox", { name: "Default editable prompt" })
    .fill("Make a miniature clay artwork from this photo.");
  await page
    .getByRole("textbox", { name: "Fixed style rule" })
    .fill("Keep every subject and object as matte hand-sculpted clay.");
  await page.getByRole("button", { name: "Publish new version" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Default editable prompt" }),
  ).toHaveValue("Make a miniature clay artwork from this photo.");
  await expect(
    page.getByRole("textbox", { name: "Fixed style rule" }),
  ).toHaveValue("Keep every subject and object as matte hand-sculpted clay.");
  await page.goto("/generate?style=clay-portrait");
  await expect(
    page.getByText("Studio template in preparation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Clay portrait/ })).toHaveCount(
    0,
  );
});
