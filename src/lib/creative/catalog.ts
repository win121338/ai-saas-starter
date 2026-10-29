import "server-only";

import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creativeTemplates, creativeTemplateVersions } from "@/db/schema";
import { creativeDefinition } from "./schema";
import type { CaseCatalog, CaseTemplate } from "@/lib/cases/types";

export async function listCreativeTemplates() {
  const rows = await db
    .select({
      row: creativeTemplates,
      definition: creativeTemplateVersions.definition,
    })
    .from(creativeTemplates)
    .leftJoin(
      creativeTemplateVersions,
      and(
        eq(creativeTemplates.id, creativeTemplateVersions.templateId),
        eq(creativeTemplates.activeVersion, creativeTemplateVersions.version),
      ),
    )
    .orderBy(asc(creativeTemplates.sortOrder), asc(creativeTemplates.id));
  return rows.map(({ row, definition }) => {
    return {
      ...row,
      draft: creativeDefinition.parse(row.draft),
      published: definition ? creativeDefinition.parse(definition) : null,
    };
  });
}

export async function getCreativeVersion(id: string, version: number) {
  const [row] = await db
    .select()
    .from(creativeTemplateVersions)
    .where(
      and(
        eq(creativeTemplateVersions.templateId, id),
        eq(creativeTemplateVersions.version, version),
      ),
    )
    .limit(1);
  return row ? creativeDefinition.parse(row.definition) : null;
}

// Public pages never need unpublished drafts or disabled collections.
export const listPublishedCreativeTemplates = cache(
  async (purpose: "display" | "creation") => {
    const rows = await db
      .select({
        id: creativeTemplates.id,
        activeVersion: creativeTemplates.activeVersion,
        creationEnabled: creativeTemplates.creationEnabled,
        featured: creativeTemplates.featured,
        definition: creativeTemplateVersions.definition,
      })
      .from(creativeTemplates)
      .innerJoin(
        creativeTemplateVersions,
        and(
          eq(creativeTemplates.id, creativeTemplateVersions.templateId),
          eq(creativeTemplates.activeVersion, creativeTemplateVersions.version),
        ),
      )
      .where(
        eq(
          purpose === "display"
            ? creativeTemplates.displayEnabled
            : creativeTemplates.creationEnabled,
          true,
        ),
      )
      .orderBy(asc(creativeTemplates.sortOrder), asc(creativeTemplates.id));
    return rows.map(({ definition, ...row }) => ({
      ...row,
      published: creativeDefinition.parse(definition),
    }));
  },
);

export const getCreativeCatalog = cache(async (): Promise<CaseCatalog> => {
  const rows = await listPublishedCreativeTemplates("display");
  const templates: CaseTemplate[] = rows.map((row) => {
    const item = row.published!;
    return {
      id: item.id,
      name: item.name,
      summary: item.summary,
      tags: item.tags,
      coverCaseId: item.coverCaseId,
      generationStyleSlug: row.creationEnabled ? item.id : null,
      cases: item.cases.map((art) => ({
        ...art,
        templateId: item.id,
        templateName: item.name,
        generationStyleSlug: row.creationEnabled ? item.id : null,
      })),
    };
  });
  const featuredTemplateId =
    rows.find((row) => row.featured)?.id ?? templates[0]?.id ?? "";
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.id === featuredTemplateId) - Number(a.id === featuredTemplateId),
  );
  const featured = ordered
    .flatMap((row) =>
      row.published!.featuredCaseIds.map((id) =>
        templates
          .find((item) => item.id === row.id)!
          .cases.find((art) => art.id === id)!,
      ),
    )
    .slice(0, 9);
  return { templates, featuredTemplateId, featured };
});
