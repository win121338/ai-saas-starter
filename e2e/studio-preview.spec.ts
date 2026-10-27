import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { creditBalance, signUp, uniqueEmail } from "./helpers";
import { Pool } from "pg";
import sharp from "sharp";
import { E2E_DATABASE_URL } from "../playwright.config";

const SEEDREAM = "doubao-seedream-5-0-flash-260915";

async function fullFramePhoto() {
  const band = (background: string) =>
    sharp({ create: { width: 600, height: 80, channels: 3, background } })
      .png()
      .toBuffer();
  return sharp(readFileSync("public/cases/blue-paper-comic/001-before.webp"))
    .resize(600, 1000, { fit: "contain" })
    .composite([
      { input: await band("#ff0000"), top: 0, left: 0 },
      { input: await band("#00ff00"), top: 920, left: 0 },
    ])
    .png()
    .toBuffer();
}

test("studio opens after Next image optimization has loaded sharp", async ({
  page,
}) => {
  const optimized = await page.request.get(
    "/_next/image?url=%2Fcases%2Fblue-paper-comic%2F001-thumb.webp&w=640&q=75",
  );
  expect(optimized.status()).toBe(200);
  await signUp(page, uniqueEmail("sharp-load-order"));
  expect((await page.goto("/zh/generate"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "做一张属于你的作品。",
  );
  await expect(
    page.getByRole("group", { name: "选择创作模板" }).getByRole("button"),
  ).toHaveCount(3);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`case-driven studio creates one mock task at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await signUp(page, uniqueEmail("creative-studio"));
    await page.goto("/zh/generate?style=blue-paper-comic");
    await expect(
      page.getByRole("button", { name: /把日常印成封面/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /油画|水彩/ })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /开始创作/ })).toBeDisabled();
    const modelChoice = page.getByRole("combobox", {
      name: "图像模型",
      exact: true,
    });
    await expect(modelChoice).toBeVisible();
    await modelChoice.selectOption(SEEDREAM);
    await expect(page.getByTestId("submission-model")).toContainText(
      "Seedream 5.0 Flash",
    );
    await page.reload();
    await expect(modelChoice).toHaveValue(SEEDREAM);
    await page.locator("#studio-photo").setInputFiles({
      name: "full-frame-source.png",
      mimeType: "image/png",
      buffer: await fullFramePhoto(),
    });
    const ratios = page.getByRole("group", { name: "输出画幅", exact: true });
    await expect(ratios.getByRole("button")).toHaveCount(10);
    const preview = page.getByTestId("studio-original-preview");
    const previewImage = preview.getByRole("img");
    await expect
      .poll(() =>
        previewImage.evaluate(
          (image: HTMLImageElement) =>
            image.complete && image.naturalHeight === 1000,
        ),
      )
      .toBe(true);
    const sourceBounds = await preview.boundingBox();
    expect(sourceBounds!.width / sourceBounds!.height).toBeCloseTo(
      600 / 1000,
      2,
    );
    for (const button of await ratios.getByRole("button").all()) {
      await button.click();
      const bounds = await preview.boundingBox();
      expect(bounds!.width).toBeCloseTo(sourceBounds!.width, 1);
      expect(bounds!.height).toBeCloseTo(sourceBounds!.height, 1);
      await expect(previewImage).toHaveCSS("object-fit", "contain");
    }
    await ratios.getByRole("button", { name: /^3:4 / }).click();
    await page.getByRole("button", { name: /闯进漫画这一格/ }).click();
    await expect(modelChoice).toHaveValue(SEEDREAM);
    await expect(ratios.getByRole("button", { name: /^3:4 / })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: /把日常印成封面/ }).click();
    await expect(modelChoice).toHaveValue(SEEDREAM);
    const chosenRatio = viewport.width > 400 ? "4:5" : "16:9";
    await ratios
      .getByRole("button", { name: new RegExp(`^${chosenRatio} `) })
      .click();
    const expectedRatio = viewport.width > 400 ? 4 / 5 : 16 / 9;
    const unchangedSource = await preview.boundingBox();
    expect(unchangedSource!.width / unchangedSource!.height).toBeCloseTo(
      600 / 1000,
      2,
    );
    await page
      .getByRole("textbox", { name: "封面标题（选填）" })
      .fill("MY MOMENT");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("creative-studio.png"),
      fullPage: true,
    });
    await expect(creditBalance(page)).toHaveText("10");
    await page.getByRole("button", { name: /开始创作/ }).click();
    // A newly compiled detail route can take longer than the default 10s in dev.
    await expect(page).toHaveURL(/\/zh\/creations\/[0-9a-f-]+$/, {
      timeout: 30000,
    });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "把日常印成封面",
    );
    const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
    try {
      const jobId = new URL(page.url()).pathname.split("/").at(-1)!;
      const saved = await pool.query<{
        model: string;
        provider: string;
        width: number;
        height: number;
      }>(
        "SELECT j.model,j.provider,a.width,a.height FROM art_jobs j JOIN art_assets a ON a.id=j.input_asset_id WHERE j.id=$1",
        [jobId],
      );
      expect(saved.rows[0]).toEqual({
        model: SEEDREAM,
        provider: "mock",
        width: 600,
        height: 1000,
      });
    } finally {
      await pool.end();
    }
    await expect(page.getByText(/状态：.*已完成/)).toBeVisible({
      timeout: 30000,
    });
    await expect(creditBalance(page)).toHaveText("9");
    await expect(
      page.getByText(new RegExp(`输出画幅: ${chosenRatio}`)),
    ).toBeVisible();
    await expect(page.getByText("使用的提示词", { exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: /再做一张/ })).toHaveAttribute(
      "href",
      `/zh/generate?style=blue-paper-comic&ratio=${encodeURIComponent(chosenRatio)}&model=${SEEDREAM}`,
    );
    const original = page.getByRole("button", {
      name: "查看大图: 原始照片",
      exact: true,
    });
    const result = page.getByRole("button", {
      name: "查看大图: 演示结果",
      exact: true,
    });
    await expect(original.getByRole("img")).toHaveCSS("object-fit", "contain");
    await page.screenshot({
      path: testInfo.outputPath("creation-full-source.png"),
      fullPage: true,
    });
    await original.click();
    const viewer = page.getByRole("dialog");
    await expect(viewer.getByRole("heading")).toHaveText("原始照片");
    const originalSrc = await viewer.getByRole("img").getAttribute("src");
    const originalUrl = new URL(originalSrc!, page.url());
    expect(originalUrl.origin).toBe(new URL(page.url()).origin);
    expect(originalUrl.pathname).toMatch(/^\/api\/art-assets\/[0-9a-f-]+$/);
    await expect
      .poll(() =>
        viewer
          .getByRole("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(
      await viewer
        .getByRole("img")
        .evaluate(
          (image: HTMLImageElement) => image.naturalWidth / image.naturalHeight,
        ),
    ).toBeCloseTo(600 / 1000, 2);
    // Both edge markers must survive the upload action and authenticated asset storage.
    const stored = await page.request.get(originalUrl.toString());
    expect(stored.ok()).toBe(true);
    const originalBytes = await stored.body();
    const pixel = async (top: number) => [
      ...(await sharp(originalBytes)
        .extract({ left: 10, top, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer()),
    ];
    const topPixel = await pixel(10);
    const bottomPixel = await pixel(990);
    expect(topPixel[0]).toBeGreaterThan(240);
    expect(topPixel[1]).toBeLessThan(15);
    expect(bottomPixel[0]).toBeLessThan(15);
    expect(bottomPixel[1]).toBeGreaterThan(240);
    await viewer.getByRole("button", { name: "按原始尺寸查看" }).click();
    await expect(viewer.getByTestId("creation-full-image")).toHaveAttribute(
      "data-zoomed",
      "true",
    );
    await viewer.getByRole("button", { name: "适应屏幕" }).click();
    await expect(viewer.getByTestId("creation-full-image")).toHaveAttribute(
      "data-zoomed",
      "false",
    );
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByRole("heading")).toHaveText("演示结果");
    expect(await viewer.getByRole("img").getAttribute("src")).not.toBe(
      originalSrc,
    );
    await expect
      .poll(() =>
        viewer
          .getByRole("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(
      await viewer
        .getByRole("img")
        .evaluate(
          (image: HTMLImageElement) => image.naturalWidth / image.naturalHeight,
        ),
    ).toBeCloseTo(expectedRatio, 2);
    await page.keyboard.press("ArrowLeft");
    await expect(viewer.getByRole("heading")).toHaveText("原始照片");
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(original).toBeFocused();
    await result.click();
    await expect(viewer.getByRole("heading")).toHaveText("演示结果");
    const bounds = await viewer.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({
      path: testInfo.outputPath("creation-large-image.png"),
      animations: "disabled",
    });
    await viewer.getByRole("button", { name: "上一张图片" }).click();
    await expect(viewer.getByRole("heading")).toHaveText("原始照片");
    await viewer.getByRole("button", { name: "关闭大图" }).click();
    await expect(viewer).toHaveCount(0);
    await expect(result).toBeFocused();
    await expect(creditBalance(page)).toHaveText("9");
    await page.getByRole("link", { name: /再做一张/ }).click();
    await expect(modelChoice).toHaveValue(SEEDREAM);
    await expect(
      page
        .getByRole("group", { name: "输出画幅", exact: true })
        .getByRole("button", { name: new RegExp(`^${chosenRatio} `) }),
    ).toHaveAttribute("aria-pressed", "true");
  });
}

test("an unavailable requested model stays visible and cannot silently fall back", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("model-unavailable"));
  await page.goto(
    "/zh/generate?style=blue-paper-comic&model=unavailable-model",
  );
  const modelChoice = page.getByRole("combobox", {
    name: "图像模型",
    exact: true,
  });
  await expect(modelChoice).toHaveValue("unavailable-model");
  await expect(
    page.getByRole("alert").filter({ hasText: "系统不会自动替换" }),
  ).toBeVisible();
  await page.locator("#studio-photo").setInputFiles({
    name: "photo.webp",
    mimeType: "image/webp",
    buffer: readFileSync("public/cases/blue-paper-comic/001-before.webp"),
  });
  await expect(page.getByRole("button", { name: /开始创作/ })).toBeDisabled();
  await modelChoice.selectOption(SEEDREAM);
  await expect(page.getByRole("button", { name: /开始创作/ })).toBeEnabled();
  await expect(creditBalance(page)).toHaveText("10");
});

test("a case retains template selection through sign in", async ({ page }) => {
  await page.goto("/zh/styles/color-block-manga");
  await page.getByRole("link", { name: "用这个模板创作" }).click();
  await expect(page).toHaveURL(/\/zh\/login\?next=/);
  const email = uniqueEmail("case-selection");
  await signUp(page, email);
  const next = new URL(page.url()).searchParams.get("next")!;
  expect(next).toBe("/zh/generate?style=color-block-manga");
  await page.goto(next);
  await expect(
    page.getByRole("button", { name: /闯进漫画这一格/ }),
  ).toHaveAttribute("aria-pressed", "true");
});
