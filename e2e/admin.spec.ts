import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { E2E_DATABASE_URL } from "../playwright.config";
import { signUp, uniqueEmail } from "./helpers";

test("admin imports, publishes and manages a new creative template without code edits", async ({
  page,
}, testInfo) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  const email = uniqueEmail("creative-admin");
  await signUp(page, email);
  expect((await page.goto("/admin"))?.status()).toBe(404);
  const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  const id = `operator-template-${Date.now()}`;
  try {
    const user = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    await pool.query(
      "INSERT INTO admin_members (user_id, role) VALUES ($1, 'admin')",
      [user.rows[0].id],
    );
    const definition = JSON.parse(
      readFileSync(
        "content/case-templates/blue-paper-comic/creative-template.json",
        "utf8",
      ),
    );
    definition.id = id;
    definition.name.en = "Operator template";
    await page.goto("/admin/templates");
    await expect(
      page.getByRole("heading", { name: "Creative templates", exact: true }),
    ).toBeVisible();
    await page.getByText("Import a template", { exact: true }).click();
    await page.getByLabel("Template package").setInputFiles({
      name: "template.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(definition)),
    });
    await page.getByRole("button", { name: "Import as draft" }).click();
    await expect(
      page.getByText("Changes saved.", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Add case artwork", { exact: true }).setInputFiles({
      name: "case.webp",
      mimeType: "image/webp",
      buffer: readFileSync("public/cases/blue-paper-comic/001-thumb.webp"),
    });
    const uploaded = page.locator('img[src^="/template-media/"]');
    await expect(uploaded).toHaveCount(1);
    const media = await page.request.get((await uploaded.getAttribute("src"))!);
    expect(media.status()).toBe(200);
    expect(media.headers()["content-type"]).toBe("image/webp");
    await page.screenshot({ path: testInfo.outputPath("creative-admin.png") });
    await page
      .getByRole("button", { name: "Publish new version", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await pool.query<{ active_version: number }>(
              "SELECT active_version FROM creative_templates WHERE id=$1",
              [id],
            )
          ).rows[0]?.active_version,
      )
      .toBe(1);
    await expect(
      page.getByText("Changes saved.", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Show in the case wall").check();
    await page.getByLabel("Allow new creations").check();
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect
      .poll(
        async () =>
          (
            await pool.query<{ ready: boolean }>(
              "SELECT (display_enabled AND creation_enabled) AS ready FROM creative_templates WHERE id=$1",
              [id],
            )
          ).rows[0]?.ready,
      )
      .toBe(true);
    await expect(
      page.getByText("Changes saved.", { exact: true }),
    ).toBeVisible();
    await page.goto(`/generate?style=${id}`);
    await expect(
      page.getByRole("button", { name: /Operator template/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.goto(`/styles/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Operator template",
    );
    await expect(
      page.getByRole("link", { name: "Create with this template" }),
    ).toHaveAttribute("href", `/generate?style=${id}`);
    await page.goto(`/admin/templates?style=${id}`);
    await page
      .getByRole("button", { name: "Save and test", exact: true })
      .click();
    await expect(page).toHaveURL(/previewVersion=2/);
    await expect(
      page.getByText(/Administrator test\. Normal credits apply/),
    ).toBeVisible();
    const active = await pool.query<{ active_version: number }>(
      "SELECT active_version FROM creative_templates WHERE id = $1",
      [id],
    );
    expect(active.rows[0].active_version).toBe(1);
    await page.goto("/admin/templates?archive=1");
    await expect(page.getByText(/Archived styles are retained/)).toBeVisible();
  } finally {
    await pool.query(
      "UPDATE creative_templates SET display_enabled=false, creation_enabled=false WHERE id=$1",
      [id],
    );
    await pool.end();
  }
});
