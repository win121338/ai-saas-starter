import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({ getLocale: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/i18n-server", () => ({ getLocale: fake.getLocale }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import Home from "@/app/(marketing)/page";
import StylesPage from "@/app/(marketing)/styles/page";
import StyleDetailPage from "@/app/(marketing)/styles/[slug]/page";
import CaseDetailPage from "@/app/(marketing)/styles/[slug]/[caseId]/page";
import sitemap from "@/app/sitemap";

beforeEach(() => {
  fake.getLocale.mockResolvedValue("en");
});

describe("curated marketing routes", () => {
  it("puts the real artwork, all three collections and gallery links on the homepage", async () => {
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain("SLOW SIP");
    expect(html).toContain("Everyday Cover");
    expect(html).toContain("Into the Manga Frame");
    expect(html).toContain("A Little Attitude");
    expect(html).toContain('href="/styles"');
    expect(html).toContain("001-after.webp");
    expect(html).not.toContain("Sample coming soon");
    expect(html).not.toContain("Watercolor");
    expect(html).not.toContain("Oil painting");
    expect((html.match(/class="case-artwork /g) ?? []).length).toBe(9);
  });

  it("localizes collection names, gallery links and case deep links", async () => {
    fake.getLocale.mockResolvedValue("zh");
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain("画出你的个性");
    expect(html).toContain("把日常印成封面");
    expect(html).toContain('href="/zh/styles"');
    expect(html).toContain('href="/zh/styles/bold-marker-doodle/007"');
    const detail = renderToStaticMarkup(
      await CaseDetailPage({
        params: Promise.resolve({ slug: "bold-marker-doodle", caseId: "007" }),
      }),
    );
    expect(detail).toContain("和狗狗一起吐舌头");
    expect(detail).toContain('href="/zh/styles/bold-marker-doodle/006"');
    expect(detail).toContain("原始照片");
  });

  it("shows one initial batch, while each collection retains all its examples", async () => {
    const wall = renderToStaticMarkup(await StylesPage());
    expect((wall.match(/class="case-artwork /g) ?? []).length).toBe(24);
    expect(wall).toContain("Load more artwork");
    const collection = renderToStaticMarkup(
      await StyleDetailPage({
        params: Promise.resolve({ slug: "blue-paper-comic" }),
      }),
    );
    expect((collection.match(/class="case-artwork /g) ?? []).length).toBe(10);
    expect(collection).toContain("Studio template in preparation");
    expect(collection).not.toContain("/generate?style=watercolor");
  });

  it("retires old style URLs and rejects unknown or mismatched artwork links", async () => {
    await expect(
      StyleDetailPage({ params: Promise.resolve({ slug: "watercolor" }) }),
    ).rejects.toThrow("NOT_FOUND");
    await expect(
      CaseDetailPage({
        params: Promise.resolve({ slug: "bold-marker-doodle", caseId: "010" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("lists the new collections and stable artwork URLs in both sitemap languages", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(62);
    expect(
      entries.some((entry) =>
        entry.url.endsWith("/zh/styles/blue-paper-comic/001"),
      ),
    ).toBe(true);
    expect(
      entries.some((entry) => /watercolor|oil-painting/.test(entry.url)),
    ).toBe(false);
  });
});
