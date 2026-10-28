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
        "content/case-templates/indie-ink-portrait/creative-template.json",
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
    const referencePreview = page.getByAltText("Style reference image", {
      exact: true,
    });
    await expect(referencePreview).toBeVisible();
    await expect(
      page.getByText(
        "Image 1 is the user's photo; image 2 is the style reference. Keep these numbers consistent in the prompt. Without a reference, only the user's photo is sent.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Single-photo recipe. Fixed style references are not supported in this release.",
        { exact: true },
      ),
    ).toHaveCount(0);
    const originalReference = (await referencePreview.getAttribute("src"))!;
    const privateReference = await page.request.get(originalReference);
    expect(privateReference.status()).toBe(200);
    expect(privateReference.headers()["cache-control"]).toBe(
      "private, no-store",
    );
    const anonymous = await page.context().browser()!.newContext();
    try {
      const denied = await anonymous.request.get(
        new URL(originalReference, page.url()).toString(),
        { maxRedirects: 0 },
      );
      expect([303, 307, 308, 401, 403, 404]).toContain(denied.status());
    } finally {
      await anonymous.close();
    }
    await page
      .getByLabel("Upload style reference", { exact: true })
      .setInputFiles({
        name: "reference.webp",
        mimeType: "image/webp",
        buffer: readFileSync("public/cases/blue-paper-comic/001-thumb.webp"),
      });
    await expect(referencePreview).toHaveAttribute(
      "src",
      /^\/creative-references\/uploads\//,
    );
    const uploadedReference = (await referencePreview.getAttribute("src"))!;
    expect((await page.request.get(uploadedReference)).status()).toBe(200);
    expect(
      (
        await page.request.get(
          uploadedReference.replace(
            "/creative-references/uploads/",
            "/template-media/",
          ),
        )
      ).status(),
    ).toBe(404);
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
    await expect(
      page.getByText(/The template style reference is included automatically/),
    ).toBeVisible();
    await page.locator("#studio-photo").setInputFiles({
      name: "photo.webp",
      mimeType: "image/webp",
      buffer: readFileSync("public/cases/blue-paper-comic/001-before.webp"),
    });
    await page.getByRole("button", { name: /Create artwork/ }).click();
    await expect(page).toHaveURL(/\/creations\/[0-9a-f-]+$/, {
      timeout: 30000,
    });
    await expect(page.getByText(/Status:.*completed/)).toBeVisible({
      timeout: 30000,
    });
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
    await page.goto(`/admin/templates?style=${id}`);
    await page
      .getByRole("button", { name: "Remove style reference", exact: true })
      .click();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect
      .poll(
        async () =>
          (
            await pool.query<{ mode: string }>(
              "SELECT draft->'recipe'->>'inputMode' AS mode FROM creative_templates WHERE id=$1",
              [id],
            )
          ).rows[0]?.mode,
      )
      .toBe("single-photo");
    const snapshot = await pool.query<{ source: string }>(
      "SELECT definition->'recipe'->'referenceImage'->>'src' AS source FROM creative_template_versions WHERE template_id=$1 AND version=1",
      [id],
    );
    expect(snapshot.rows[0].source).toBe(uploadedReference);
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
