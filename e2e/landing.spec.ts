import { expect, test } from "@playwright/test";

test("landing and collections expose real cases and retire placeholder styles", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your photo.",
  );
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Open studio" }),
  ).toHaveAttribute("href", "/generate");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Sign in" }),
  ).toBeVisible();
  await expect(page.locator("#collections a.case-collection")).toHaveCount(3);
  await expect(page.locator("#cases a.case-artwork")).toHaveCount(9);
  await expect(page.getByText("Oil painting", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Watercolor", { exact: true })).toHaveCount(0);

  await page.goto("/styles/blue-paper-comic");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Everyday Cover",
  );
  await expect(page.locator("a.case-artwork")).toHaveCount(10);
  await page
    .getByRole("link", { name: "Open artwork: SLOW SIP", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Original photo", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the case wall filters, searches and loads the final case", async ({
  page,
}) => {
  await page.goto("/styles");
  await expect(page.locator("a.case-artwork")).toHaveCount(24);
  await page.getByRole("button", { name: "Load more artwork" }).click();
  await expect(page.locator("a.case-artwork")).toHaveCount(25);
  await page.getByRole("button", { name: /A Little Attitude/ }).click();
  await expect(page.locator("a.case-artwork")).toHaveCount(7);
  await page.getByRole("searchbox", { name: "Search cases" }).fill("octopus");
  await expect(page.locator("a.case-artwork")).toHaveCount(1);
  await expect(page).toHaveURL(/collection=bold-marker-doodle.*q=octopus/);
});

test("pricing preview does not expose the starter's paid offers", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Create on your terms.",
  );
  await expect(page.getByText("Price to be announced")).toHaveCount(2);
  await expect(
    page.getByRole("main").getByRole("link", { name: "Open studio" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /checkout|buy/i })).toHaveCount(
    0,
  );
});
