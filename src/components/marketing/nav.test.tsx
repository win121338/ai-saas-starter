import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  getSession: vi.fn(),
  getLocale: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getSession: fake.getSession }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: fake.getLocale }));
vi.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => null,
}));

import { MarketingFooter } from "./footer";
import { MarketingNav } from "./nav";

beforeEach(() => {
  fake.getLocale.mockResolvedValue("en");
  fake.getSession.mockReset();
});

describe("marketing account links", () => {
  it("offers sign-in when the visitor has no session", async () => {
    fake.getSession.mockResolvedValue(null);
    const header = renderToStaticMarkup(await MarketingNav());
    const footer = renderToStaticMarkup(await MarketingFooter());
    expect(header).toContain('href="/login"');
    expect(header).toContain("Sign in");
    expect(footer).toContain('href="/login"');
    expect(footer).not.toContain('href="/dashboard"');
  });

  it("shows only the studio action when the visitor is signed in", async () => {
    fake.getSession.mockResolvedValue({ user: { id: "user-1" } });
    const header = renderToStaticMarkup(await MarketingNav());
    const footer = renderToStaticMarkup(await MarketingFooter());
    expect(header).toContain('href="/generate"');
    expect(header).toContain("Open studio");
    expect(header).not.toContain('href="/dashboard"');
    expect(header).not.toContain('href="/login"');
    expect(footer).toContain('href="/dashboard"');
    expect(footer).not.toContain('href="/login"');
  });

  it("keeps the studio destination localized in Chinese", async () => {
    fake.getLocale.mockResolvedValue("zh");
    fake.getSession.mockResolvedValue({ user: { id: "user-1" } });
    const header = renderToStaticMarkup(await MarketingNav());
    expect(header).toContain('href="/zh/generate"');
    expect(header).toContain("打开工作台");
    expect(header).not.toContain("你的工作空间");
  });
});
