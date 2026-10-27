import { expect, test } from "@playwright/test";

import { creditBalance, signUp, uniqueEmail } from "./helpers";

test("studio opens after Next image optimization has loaded sharp", async ({
  page,
}, testInfo) => {
  const optimized = await page.request.get(
    "/_next/image?url=%2Fcases%2Fblue-paper-comic%2F001-thumb.webp&w=640&q=75",
  );
  expect(optimized.status()).toBe(200);
  expect(optimized.headers()["content-type"]).toMatch(/^image\//);
  await signUp(page, uniqueEmail("sharp-load-order"));
  const response = await page.goto("/zh/generate");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "新的画风，正在准备。",
  );
  await expect(page.locator("a.case-collection")).toHaveCount(3);
  await page.screenshot({
    path: testInfo.outputPath("studio-sharp-fixed.png"),
    fullPage: true,
  });
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`studio shows the new collections without retired presets at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await signUp(page, uniqueEmail("curated-studio"));
    await page.goto("/zh/generate?style=watercolor");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "新的画风，正在准备。",
    );
    await expect(page.locator("a.case-collection")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /油画|水彩/ })).toHaveCount(
      0,
    );
    await expect(page.locator("#studio-photo")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("studio-collections.png"),
      fullPage: true,
    });
    await page
      .locator('a.case-collection[href="/zh/styles/blue-paper-comic"]')
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "把日常印成封面",
    );
  });
}

// The generation/action and job suites retain the historical recipe, credit,
// storage and ownership checks. The public studio intentionally pauses those
// presets while the replacement templates are prepared.
test("preparing a replacement collection does not spend existing credits", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("pending-collection"));
  await page.goto("/dashboard");
  await expect(creditBalance(page)).toHaveText("10");
  await page.goto("/generate?style=watercolor");
  await expect(
    page.getByText("Studio template in preparation", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Create for/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Watercolor|Oil painting/ }),
  ).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(creditBalance(page)).toHaveText("10");
});
