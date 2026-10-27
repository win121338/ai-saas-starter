import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  requireSession: vi.fn(),
  requireAdmin: vi.fn(),
  list: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ requireSession: fake.requireSession }));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: fake.requireAdmin }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: async () => "zh" }));
vi.mock("@/lib/creative/catalog", () => ({
  listCreativeTemplates: fake.list,
  getCreativeVersion: async () => null,
}));
vi.mock("@/lib/art/provider", () => ({
  artModelAvailable: () => true,
  FAL_MODEL: "fal-ai/flux-pro/kontext",
}));
vi.mock("@/lib/admin/settings", () => ({
  listModelSettings: async () => ({ "qwen-image-2.1-turbo": true }),
  getSiteAnnouncement: async () => "",
}));
vi.mock("@/components/generate/creative-studio", () => ({
  CreativeStudio: ({
    templates,
    initialModel,
  }: {
    templates: unknown[];
    initialModel?: string;
  }) => <pre>{JSON.stringify({ templates, initialModel })}</pre>,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import GeneratePage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  fake.requireSession.mockResolvedValue({ user: { id: "studio-user" } });
  const published = JSON.parse(
    readFileSync(
      "content/case-templates/blue-paper-comic/creative-template.json",
      "utf8",
    ),
  );
  fake.list.mockResolvedValue([
    { id: published.id, published, activeVersion: 1, creationEnabled: true },
  ]);
});

describe("creative studio page", () => {
  it("passes a requested Seedream model through without replacing it with the template default", async () => {
    const html = renderToStaticMarkup(
      await GeneratePage({
        searchParams: Promise.resolve({
          model: "doubao-seedream-5-0-flash-260915",
        }),
      }),
    );
    expect(html).toContain(
      "initialModel&quot;:&quot;doubao-seedream-5-0-flash-260915",
    );
  });
  it("serves an active template without serializing its internal recipe", async () => {
    const html = renderToStaticMarkup(
      await GeneratePage({ searchParams: Promise.resolve({}) }),
    );
    expect(fake.requireSession).toHaveBeenCalledOnce();
    expect(html).toContain("做一张属于你的作品");
    expect(html).toContain("把日常印成封面");
    expect(html).not.toContain("#316793");
    expect(html).not.toContain("recipe");
    expect(html).not.toContain("正在准备");
  });
  it("checks the session before loading templates", async () => {
    fake.requireSession.mockRejectedValueOnce(new Error("AUTH_REQUIRED"));
    await expect(
      GeneratePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("AUTH_REQUIRED");
    expect(fake.list).not.toHaveBeenCalled();
  });
  it("checks administrator access for draft previews", async () => {
    fake.requireAdmin.mockRejectedValueOnce(new Error("ADMIN_REQUIRED"));
    await expect(
      GeneratePage({
        searchParams: Promise.resolve({
          style: "blue-paper-comic",
          previewVersion: "2",
        }),
      }),
    ).rejects.toThrow("ADMIN_REQUIRED");
    expect(fake.list).not.toHaveBeenCalled();
  });
});
