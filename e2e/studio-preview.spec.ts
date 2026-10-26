import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import sharp from "sharp";

import { E2E_DATABASE_URL } from "../playwright.config";
import { creditBalance, signUp, uniqueEmail } from "./helpers";

test("photo-to-art job persists, downloads privately, and spends once", async ({
  page,
  browser,
}) => {
  await signUp(page, uniqueEmail("art"));
  const png = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#6699aa" },
  })
    .png()
    .toBuffer();
  await page.goto("/generate?style=watercolor");
  await expect(
    page.getByRole("button", { name: /Watercolor/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const prompt = page.getByRole("textbox", { name: "Generation prompt" });
  await expect(prompt).toHaveValue(/translucent washes/);
  await expect(page.getByText(/STYLE RULE — WATERCOLOR/)).toBeVisible();
  const customPrompt =
    "Keep the original composition and use soft blue washes.";
  await prompt.fill(customPrompt);
  await page.getByRole("button", { name: /Oil painting/ }).click();
  await expect(prompt).toHaveValue(customPrompt);
  await expect(page.getByText(/STYLE RULE — OIL PAINTING/)).toBeVisible();
  await page.getByRole("button", { name: "Restore style preset" }).click();
  await expect(prompt).toHaveValue(/layered brushwork/);
  await page.getByRole("button", { name: /Watercolor/ }).click();
  await expect(prompt).toHaveValue(/translucent washes/);
  await prompt.fill(customPrompt);
  await page.locator("#studio-photo").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByRole("button", { name: /Create for 1 credit/ }).click();
  await expect(page).toHaveURL(/\/creations\/[0-9a-f-]+/);
  const jobId = page.url().match(/\/creations\/([0-9a-f-]+)/)?.[1];
  expect(jobId).toBeTruthy();
  const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  try {
    const saved = await pool.query<{
      prompt_override: string | null;
      style_slug: string;
      style_version: number;
    }>(
      "SELECT prompt_override, style_slug, style_version FROM art_jobs WHERE id = $1",
      [jobId],
    );
    expect(saved.rows[0]).toMatchObject({
      prompt_override: customPrompt,
      style_slug: "watercolor",
      style_version: 3,
    });
  } finally {
    await pool.end();
  }
  await expect(page.getByText(/Status: completed/)).toBeVisible({
    timeout: 30_000,
  });
  const result = page.getByAltText("Finished artwork");
  await expect(result).toBeVisible();
  const source = await result.getAttribute("src");
  expect(source).toMatch(/^\/api\/art-assets\/[0-9a-f-]+$/);
  const served = await page.request.get(source!);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/webp");

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signUp(otherPage, uniqueEmail("other-art"));
  expect((await otherPage.request.get(source!)).status()).toBe(404);
  await other.close();

  await page.reload();
  await expect(page.getByAltText("Finished artwork")).toBeVisible();
  await page.goto("/dashboard");
  await expect(creditBalance(page)).toHaveText("9");
});
