import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const caseId = z.string().regex(/^\d{3}$/);
const text = z.object({ en: z.string().min(1), zh: z.string().min(1) });
const imagePath = z
  .string()
  .regex(/^\/cases\/[a-z0-9-]+\/\d{3}-(?:before|after|thumb)\.webp$/);
const dimensions = z.tuple([
  z.number().int().positive(),
  z.number().int().positive(),
]);

export const caseGalleryQuerySchema = z.object({
  collection: slug.or(z.literal("all")).catch("all"),
  q: z.string().max(200).catch(""),
  limit: z.coerce.number().int().min(24).max(100_000).catch(24),
});

export const caseManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: slug,
    name: text,
    summary: text,
    tags: z.array(z.string().min(1)),
    status: z.enum(["draft", "ready", "published", "archived"]),
    displayPermission: z.enum(["unknown", "confirmed", "restricted"]),
    generationReady: z.boolean(),
    generation: z.object({
      tested: z.boolean(),
      publishedStyleSlug: slug.nullable(),
    }),
    coverCaseId: caseId,
    cases: z
      .array(
        z.object({
          id: caseId,
          title: z.string().min(1),
          titleEn: z.string().min(1),
          alt: text,
          subjectTags: z.array(z.string().min(1)),
          assets: z.object({
            before: imagePath.nullable(),
            after: imagePath,
            thumb: imagePath,
          }),
          assetSizes: z.object({
            before: dimensions.nullable(),
            after: dimensions,
            thumb: dimensions,
          }),
          review: z.enum(["pending", "passed", "needs-review", "excluded"]),
        }),
      )
      .min(1),
  })
  .superRefine((manifest, ctx) => {
    const ids = manifest.cases.map((item) => item.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Duplicate artwork ID" });
    if (
      !manifest.cases.some(
        (item) => item.id === manifest.coverCaseId && item.review === "passed",
      )
    )
      ctx.addIssue({ code: "custom", message: "A reviewed cover is required" });
    for (const item of manifest.cases) {
      for (const kind of ["before", "after", "thumb"] as const) {
        const value = item.assets[kind];
        if (value && value !== `/cases/${manifest.id}/${item.id}-${kind}.webp`)
          ctx.addIssue({
            code: "custom",
            message: "Artwork path does not match its collection and ID",
          });
        if (Boolean(value) !== Boolean(item.assetSizes[kind]))
          ctx.addIssue({
            code: "custom",
            message: "Image path and dimensions must match",
          });
      }
    }
  });

export const caseCatalogSchema = z
  .object({
    version: z.literal(1),
    templateIds: z.array(slug).min(1),
    featuredTemplateId: slug,
    featuredCases: z
      .array(z.object({ templateId: slug, caseId }))
      .min(1)
      .max(9),
  })
  .superRefine((catalog, ctx) => {
    if (new Set(catalog.templateIds).size !== catalog.templateIds.length)
      ctx.addIssue({ code: "custom", message: "Duplicate collection ID" });
    if (!catalog.templateIds.includes(catalog.featuredTemplateId))
      ctx.addIssue({
        code: "custom",
        message: "Featured collection is not in the catalog",
      });
    const featuredIds = catalog.featuredCases.map(
      (item) => `${item.templateId}/${item.caseId}`,
    );
    if (new Set(featuredIds).size !== featuredIds.length)
      ctx.addIssue({ code: "custom", message: "Duplicate featured artwork" });
    if (
      catalog.featuredCases.some(
        (item) => !catalog.templateIds.includes(item.templateId),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Featured artwork collection is not in the catalog",
      });
  });
