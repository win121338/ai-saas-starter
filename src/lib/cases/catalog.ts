import "server-only";

import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import { caseCatalogSchema, caseManifestSchema } from "@/lib/cases/schema";
import type {
  CaseArtwork,
  CaseCatalog,
  CaseImage,
  CaseTemplate,
} from "@/lib/cases/types";

const contentRoot = path.join(process.cwd(), "content", "case-templates");
const publicRoot = path.join(process.cwd(), "public");

async function verifyImage(image: CaseImage | null) {
  if (!image) return;
  const filename = await realpath(path.join(publicRoot, image.src.slice(1)));
  const relative = path.relative(await realpath(publicRoot), filename);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !(await stat(filename)).isFile()
  )
    throw new Error("Artwork image is outside the public directory");
}

/** Read approved content on the server; return an explicit public projection. */
export async function loadCaseCatalog(
  directory = contentRoot,
  verifyAssets = true,
): Promise<CaseCatalog> {
  const registry = caseCatalogSchema.parse(
    JSON.parse(await readFile(path.join(directory, "catalog.json"), "utf8")),
  );
  const templates = await Promise.all(
    registry.templateIds.map(async (id): Promise<CaseTemplate> => {
      const manifest = caseManifestSchema.parse(
        JSON.parse(
          await readFile(path.join(directory, id, "template.json"), "utf8"),
        ),
      );
      if (
        manifest.id !== id ||
        !["ready", "published"].includes(manifest.status) ||
        manifest.displayPermission !== "confirmed"
      )
        throw new Error(`Collection is not approved for display: ${id}`);
      const cases = await Promise.all(
        manifest.cases
          .filter((item) => item.review === "passed")
          .map(async (item): Promise<CaseArtwork> => {
            const before =
              item.assets.before && item.assetSizes.before
                ? {
                    src: item.assets.before,
                    width: item.assetSizes.before[0],
                    height: item.assetSizes.before[1],
                  }
                : null;
            const after = {
              src: item.assets.after,
              width: item.assetSizes.after[0],
              height: item.assetSizes.after[1],
            };
            const thumbnail = {
              src: item.assets.thumb,
              width: item.assetSizes.thumb[0],
              height: item.assetSizes.thumb[1],
            };
            if (verifyAssets) {
              await Promise.all([
                verifyImage(before),
                verifyImage(after),
                verifyImage(thumbnail),
              ]);
            }
            return {
              id: item.id,
              templateId: id,
              templateName: manifest.name,
              title: { zh: item.title, en: item.titleEn },
              alt: item.alt,
              before,
              after,
              thumbnail,
              tags: [...manifest.tags, ...item.subjectTags],
            };
          }),
      );
      return {
        id,
        name: manifest.name,
        summary: manifest.summary,
        tags: manifest.tags,
        coverCaseId: manifest.coverCaseId,
        generationStyleSlug:
          manifest.generationReady && manifest.generation.tested
            ? manifest.generation.publishedStyleSlug
            : null,
        cases,
      };
    }),
  );
  const featured = registry.featuredCases.map((reference) => {
    const artwork = templates
      .find((item) => item.id === reference.templateId)
      ?.cases.find((item) => item.id === reference.caseId);
    if (!artwork)
      throw new Error("Featured artwork is missing or has not passed review");
    return artwork;
  });
  return {
    templates,
    featuredTemplateId: registry.featuredTemplateId,
    featured,
  };
}

// Static images may live on the deployment CDN rather than in the server
// bundle. The catalog tests validate their files; rendering needs JSON only.
export const getCaseCatalog = cache(() => loadCaseCatalog(contentRoot, false));
