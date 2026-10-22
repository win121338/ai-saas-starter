import { expect, test } from "@playwright/test";

test("landing and style pages lead into the studio", async ({ page }) => {
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
  await expect(
    page.locator("#styles").locator("a.artora-style-card"),
  ).toHaveCount(6);
  await expect(page.locator("#how-it-works")).toContainText("Bring a photo");
  await expect(
    page.getByText(/Live image API testing is in progress/),
  ).toBeVisible();

  await page.goto("/styles/watercolor");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Watercolor",
  );
  await expect(
    page.getByRole("link", { name: "Try this style" }),
  ).toHaveAttribute("href", "/generate?style=watercolor");
});

test("pricing preview does not expose the starter's paid offers", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Create on your terms.",
  );
  await expect(page.getByText("Price to be announced")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Open studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: /checkout|buy/i })).toHaveCount(
    0,
  );
});
