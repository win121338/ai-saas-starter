import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({ requireSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireSession: fake.requireSession }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: async () => "zh" }));
vi.mock("@/components/generate/studio-preview", () => {
  throw new Error("Inactive studio must not load the generation client");
});
vi.mock("@/lib/art/provider", () => {
  throw new Error("Inactive studio must not load native image processing");
});

import GeneratePage from "./page";

beforeEach(() => {
  fake.requireSession.mockReset();
  fake.requireSession.mockResolvedValue({ user: { id: "studio-user" } });
});

describe("studio preparation page", () => {
  it("renders the curated collections without loading inactive image processing", async () => {
    const html = renderToStaticMarkup(
      await GeneratePage({ searchParams: Promise.resolve({}) }),
    );
    expect(fake.requireSession).toHaveBeenCalledOnce();
    expect(html).toContain("新的画风，正在准备。");
    expect(html).toContain("把日常印成封面");
    expect(html).toContain("闯进漫画这一格");
    expect(html).toContain("今天有点小脾气");
    expect(html).not.toContain("studio-photo");
  });

  it("still checks the session before serving the preparation page", async () => {
    fake.requireSession.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(
      GeneratePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("AUTH_REQUIRED");
  });
});
