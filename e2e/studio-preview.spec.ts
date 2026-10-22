import { expect, test } from "@playwright/test";
import sharp from "sharp";

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
  await page
    .locator("#studio-photo")
    .setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: png,
    });
  await page.getByRole("button", { name: /Create for 1 credit/ }).click();
  await expect(page).toHaveURL(/\/creations\/[0-9a-f-]+/);
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
