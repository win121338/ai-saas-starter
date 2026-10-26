import { describe, expect, it } from "vitest";

import { localeFromPath, localizedHref, stripLocale } from "./i18n";

describe("locale paths", () => {
  it("keeps English on the existing URLs", () => {
    expect(localeFromPath("/styles")).toBe("en");
    expect(localizedHref("/styles/oil-painting?from=home", "en")).toBe(
      "/styles/oil-painting?from=home",
    );
  });

  it("provides equivalent Chinese URLs", () => {
    expect(localeFromPath("/zh")).toBe("zh");
    expect(localeFromPath("/zh/styles")).toBe("zh");
    expect(localeFromPath("/zhong")).toBe("en");
    expect(localizedHref("/", "zh")).toBe("/zh");
    expect(localizedHref("/styles?tab=all#top", "zh")).toBe(
      "/zh/styles?tab=all#top",
    );
    expect(localizedHref("/zh/styles", "en")).toBe("/styles");
    expect(localizedHref("/zh?from=studio", "en")).toBe("/?from=studio");
    expect(stripLocale("/zh/creations/123")).toBe("/creations/123");
  });

  it("leaves external links alone", () => {
    expect(localizedHref("https://fal.ai", "zh")).toBe("https://fal.ai");
    expect(localizedHref("//example.com", "zh")).toBe("//example.com");
  });
});
