import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadCaseCatalog } from "@/lib/cases/catalog";
import { filterCaseArtworks } from "@/lib/cases/gallery";
import {
  caseCatalogSchema,
  caseGalleryQuerySchema,
  caseManifestSchema,
} from "@/lib/cases/schema";
import {
  artworkHref,
  templateCover,
  type CaseCatalog,
} from "@/lib/cases/types";

let catalog: CaseCatalog;
let rawManifest: Record<string, unknown>;

beforeAll(async () => {
  catalog = await loadCaseCatalog();
  rawManifest = JSON.parse(
    await readFile(
      path.join(
        process.cwd(),
        "content/case-templates/blue-paper-comic/template.json",
      ),
      "utf8",
    ),
  );
});

describe("approved case catalog", () => {
  it("loads all three real collections and nine unique selections", () => {
    expect(catalog.templates.map((item) => item.id)).toEqual([
      "blue-paper-comic",
      "color-block-manga",
      "bold-marker-doodle",
    ]);
    expect(catalog.templates.map((item) => item.cases.length)).toEqual([
      10, 8, 7,
    ]);
    expect(catalog.featured).toHaveLength(9);
    expect(new Set(catalog.featured.map(artworkHref)).size).toBe(9);
    expect(catalog.featuredTemplateId).toBe("blue-paper-comic");
    expect(templateCover(catalog.templates[0]).id).toBe("001");
    expect(
      catalog.templates.every((item) => item.generationStyleSlug === null),
    ).toBe(true);
  });

  it("projects public fields without prompts, original paths or internal records", () => {
    const serialized = JSON.stringify(catalog);
    for (const privateField of [
      "sourceSha256",
      "cropRects",
      "prompt-v1",
      "p.md",
      "originals/",
      "processingKey",
      "publishedPromptVersion",
      "evaluation",
      "displayApprovalNote",
    ])
      expect(serialized).not.toContain(privateField);
    expect(serialized).not.toContain("oil-painting");
    expect(serialized).not.toContain("watercolor");
  });

  it("matches each real image's decoded dimensions and keeps the complete square artwork", async () => {
    await Promise.all(
      catalog.templates
        .flatMap((template) => template.cases)
        .flatMap((artwork) =>
          [artwork.before, artwork.after, artwork.thumbnail]
            .filter((item) => item !== null)
            .map(async (image) => {
              const metadata = await sharp(
                path.join(process.cwd(), "public", image.src.slice(1)),
              ).metadata();
              expect([metadata.width, metadata.height]).toEqual([
                image.width,
                image.height,
              ]);
            }),
        ),
    );
    expect(
      catalog.templates
        .flatMap((template) => template.cases)
        .every(
          (item) => item.after.width === 1206 && item.after.height === 1206,
        ),
    ).toBe(true);
  });

  it("rejects duplicate collections, unsafe paths, foreign image IDs and missing covers", () => {
    expect(
      caseCatalogSchema.safeParse({
        version: 1,
        templateIds: ["blue-paper-comic", "blue-paper-comic"],
        featuredTemplateId: "blue-paper-comic",
        featuredCases: [{ templateId: "blue-paper-comic", caseId: "001" }],
      }).success,
    ).toBe(false);
    const manifest = caseManifestSchema.parse(rawManifest);
    for (const invalid of [
      "/cases/../p.md",
      "/cases/color-block-manga/001-after.webp",
      "/cases/blue-paper-comic/999-after.webp",
      "https://example.com/image.webp",
    ]) {
      const changed = structuredClone(manifest);
      changed.cases[0].assets.after = invalid;
      expect(caseManifestSchema.safeParse(changed).success).toBe(false);
    }
    expect(
      caseManifestSchema.safeParse({ ...manifest, coverCaseId: "999" }).success,
    ).toBe(false);
    expect(
      caseManifestSchema.safeParse({
        ...manifest,
        cases: [...manifest.cases, manifest.cases[0]],
      }).success,
    ).toBe(false);
  });
});

describe("gallery search and URL state", () => {
  it("combines collection filtering, case-insensitive terms and both languages", () => {
    const items = catalog.templates.flatMap((item) => item.cases);
    expect(
      filterCaseArtworks(items, "color-block-manga", "", "en"),
    ).toHaveLength(8);
    expect(
      filterCaseArtworks(items, "all", "slow sip", "en").map(artworkHref),
    ).toEqual(["/styles/blue-paper-comic/001"]);
    expect(
      filterCaseArtworks(items, "all", "宠物", "en").map(artworkHref),
    ).toEqual(["/styles/bold-marker-doodle/007"]);
    expect(
      filterCaseArtworks(items, "all", "章鱼帽", "zh").map(artworkHref),
    ).toEqual(["/styles/bold-marker-doodle/006"]);
    expect(
      filterCaseArtworks(items, "color-block-manga", "章鱼帽", "zh"),
    ).toEqual([]);
  });

  it("bounds untrusted query values and defaults to one batch of 24", () => {
    expect(
      caseGalleryQuerySchema.parse({
        collection: "../private",
        q: null,
        limit: "Infinity",
      }),
    ).toEqual({ collection: "all", q: "", limit: 24 });
    expect(
      caseGalleryQuerySchema.parse({
        collection: "blue-paper-comic",
        q: "sip",
        limit: "48",
      }),
    ).toEqual({ collection: "blue-paper-comic", q: "sip", limit: 48 });
    expect(
      caseGalleryQuerySchema.parse({
        collection: null,
        q: "x".repeat(201),
        limit: "-1",
      }).limit,
    ).toBe(24);
  });
});
