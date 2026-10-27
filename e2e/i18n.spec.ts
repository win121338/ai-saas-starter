import { expect, test } from "@playwright/test";

test("English remains the default and Chinese pages have equivalent links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your photo.",
  );

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "你的照片",
  );
  await expect(
    page.getByRole("banner").getByRole("link", { name: /打开工作台/ }),
  ).toHaveAttribute("href", "/zh/generate");
});

test("language switch keeps the matching style page and URL state", async ({
  page,
}) => {
  await page.goto("/zh/styles/blue-paper-comic?source=gallery#top");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "把日常印成封面",
  );
  await expect(
    page.getByRole("link", {
      name: "打开作品: SLOW SIP · 慢慢喝",
      exact: true,
    }),
  ).toHaveAttribute("href", "/zh/styles/blue-paper-comic/001");

  await page.getByRole("button", { name: "切换到英语" }).click();
  await expect(page).toHaveURL(
    /\/styles\/blue-paper-comic\?source=gallery#top$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Everyday Cover",
  );
});

test("a signed-out Chinese studio request returns to Chinese sign-in", async ({
  page,
}) => {
  await page.goto("/zh/generate?style=watercolor");
  await expect(page).toHaveURL(
    /\/zh\/login\?next=%2Fzh%2Fgenerate%3Fstyle%3Dwatercolor/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "欢迎回来。",
  );
  await expect(page.getByRole("link", { name: "立即注册" })).toHaveAttribute(
    "href",
    /\/zh\/signup\?next=/,
  );
});
