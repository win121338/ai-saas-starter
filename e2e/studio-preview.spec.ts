import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import sharp from "sharp";

import { E2E_DATABASE_URL } from "../playwright.config";
import { creditBalance, signUp, uniqueEmail } from "./helpers";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`studio controls collapse and reopen at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await signUp(page, uniqueEmail("compact-studio"));
    await page.goto("/zh/generate");
    await page.getByRole("button", { name: "1:1", exact: true }).click();
    const ratio = page
      .locator("details")
      .filter({ has: page.locator("summary").filter({ hasText: "图片比例" }) });
    await expect(ratio).not.toHaveAttribute("open");
    await ratio.locator("summary").click();
    await expect(
      page.getByRole("button", { name: "1:1", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "1:1", exact: true }).click();
    await page.getByRole("button", { name: /水彩/ }).click();
    await expect(page.getByRole("button", { name: /油画/ })).toBeHidden();
    const model = page.locator("summary").filter({ hasText: "选择模型" });
    await model.click();
    const select = page.getByRole("combobox", { name: "选择模型" });
    const current = await select.inputValue();
    const option = await select
      .locator("option:not([disabled])")
      .evaluateAll(
        (options, value) =>
          options
            .map((option) => (option as HTMLOptionElement).value)
            .find((optionValue) => optionValue !== value),
        current,
      );
    expect(option).toBeTruthy();
    await select.selectOption(option!);
    await expect(select).toBeHidden();
    await model.click();
    await expect(select).toHaveValue(option!);
    await model.click();
    const png = await sharp({
      create: { width: 320, height: 240, channels: 3, background: "#6699aa" },
    })
      .png()
      .toBuffer();
    await page
      .locator("#studio-photo")
      .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
    await expect(page.getByAltText("所选照片预览")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("studio-compact.png"),
      fullPage: true,
    });
  });
}

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
  await page
    .locator("summary")
    .filter({ hasText: "Generation prompt" })
    .click();
  const prompt = page.getByRole("textbox", { name: "Generation prompt" });
  await expect(prompt).toHaveValue(/translucent washes/);
  await expect(page.getByText(/STYLE RULE — WATERCOLOR/)).toBeVisible();
  const customPrompt =
    "Keep the original composition and use soft blue washes.";
  await prompt.fill(customPrompt);
  await page.getByRole("button", { name: /Oil painting/ }).click();
  await expect(page.getByRole("button", { name: /Watercolor/ })).toBeHidden();
  await expect(prompt).toHaveValue(customPrompt);
  await expect(page.getByText(/STYLE RULE — OIL PAINTING/)).toBeVisible();
  await page.getByRole("button", { name: "Restore style preset" }).click();
  await expect(prompt).toHaveValue(/layered brushwork/);
  await page.locator("summary").filter({ hasText: "Choose a style" }).click();
  await page.getByRole("button", { name: /Watercolor/ }).click();
  await expect(prompt).toHaveValue(/translucent washes/);
  await prompt.fill(customPrompt);
  await page.locator("#studio-photo").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByAltText("Selected photo preview")).toBeHidden();
  await page.getByRole("button", { name: "3:4", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "1:1", exact: true }),
  ).toBeHidden();
  await page.locator("summary").filter({ hasText: "Photo ratio" }).click();
  await expect(
    page.getByRole("button", { name: "3:4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "3:4", exact: true }).click();
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
      width: number;
      height: number;
    }>(
      "SELECT j.prompt_override, j.style_slug, j.style_version, a.width, a.height FROM art_jobs j JOIN art_assets a ON a.id = j.input_asset_id WHERE j.id = $1",
      [jobId],
    );
    expect(saved.rows[0]).toMatchObject({
      prompt_override: customPrompt,
      style_slug: "watercolor",
      style_version: 3,
      width: 48,
      height: 64,
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
