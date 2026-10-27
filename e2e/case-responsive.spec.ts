import { expect, test, type Page } from "@playwright/test";

async function expectBalancedWall(page: Page, expectedColumns: number) {
  const wall = page.getByTestId("case-wall");
  await expect(wall).toHaveAttribute("data-masonry", "true");
  await expect
    .poll(async () =>
      wall.evaluate((element, columns) => {
        const bounds = element.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(element).columnGap);
        const cards = Array.from(
          element.querySelectorAll("a.case-artwork"),
          (card) => card.getBoundingClientRect(),
        );
        const grouped = new Map<number, DOMRect[]>();
        for (const card of cards) {
          const x = Math.round(card.left);
          grouped.set(x, [...(grouped.get(x) ?? []), card]);
        }
        const bottoms = [...grouped.values()].map((column) =>
          Math.max(...column.map((card) => card.bottom)),
        );
        const maxHeight = Math.max(...cards.map((card) => card.height));
        const noOverlap = [...grouped.values()].every((column) => {
          const sorted = [...column].sort((a, b) => a.top - b.top);
          return sorted.every(
            (card, index) =>
              index === 0 || card.top >= sorted[index - 1].bottom + gap - 1,
          );
        });
        return (
          grouped.size === columns &&
          Math.max(...bottoms) - Math.min(...bottoms) <= maxHeight + gap + 1 &&
          cards.every(
            (card) =>
              card.left >= bounds.left - 1 &&
              card.right <= bounds.right + 1 &&
              card.bottom <= bounds.bottom + 1,
          ) &&
          noOverlap
        );
      }, expectedColumns),
    )
    .toBe(true);
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`case presentation and enlargement work at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "画出你的个性",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("homepage.png"),
      fullPage: true,
    });
    const featured = page.getByTestId("featured-case");
    const manga = featured.getByRole("button", { name: /闯进漫画这一格/ });
    await manga.click();
    await expect(manga).toHaveAttribute("aria-pressed", "true");
    await expect(
      featured.getByAltText("原始照片: 棕榈与红色假日"),
    ).toBeVisible();

    await page.goto("/zh/styles#case-wall");
    const first = page.getByRole("link", {
      name: "打开作品: SLOW SIP · 慢慢喝",
      exact: true,
    });
    await first.click();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText("原始照片", { exact: true })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByRole("heading")).toContainText("RIDE READY");
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
    await expect(first).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("case-wall.png"),
      fullPage: true,
    });
  });

  test(`expanded case wall stays balanced at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/zh/styles#case-wall");
    await expect(page.locator("a.case-artwork")).toHaveCount(24);
    await expectBalancedWall(page, viewport.width >= 768 ? 3 : 2);
    await page
      .getByRole("button", { name: "加载更多作品", exact: true })
      .click();
    await expect(page.locator("a.case-artwork")).toHaveCount(25);
    await expectBalancedWall(page, viewport.width >= 768 ? 3 : 2);

    await page.getByRole("button", { name: /今天有点小脾气/ }).click();
    await expect(page.locator("a.case-artwork")).toHaveCount(7);
    await expectBalancedWall(page, viewport.width >= 768 ? 3 : 2);
    await page.getByRole("button", { name: /全部作品/ }).click();
    await page
      .getByRole("button", { name: "加载更多作品", exact: true })
      .click();
    const resizedWidth = viewport.width >= 768 ? 390 : 1440;
    await page.setViewportSize({
      width: resizedWidth,
      height: viewport.height,
    });
    await expectBalancedWall(page, resizedWidth >= 768 ? 3 : 2);
    await page.setViewportSize(viewport);
    await expectBalancedWall(page, viewport.width >= 768 ? 3 : 2);
    await page.locator("a.case-artwork").nth(18).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("expanded-wall-balanced.png"),
    });
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("expanded-wall-tail.png"),
    });
  });
}
