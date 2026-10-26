import "server-only";

import { eq, sql } from "drizzle-orm";

import { ART_PROMPT_VERSION } from "@/config/art-prompts";
import { db } from "@/db";
import {
  adminAuditEvents,
  artStyleSettings,
  artStyleTemplateVersions,
} from "@/db/schema";
import { auditValues } from "./audit";

export async function publishArtTemplate(input: {
  slug: string;
  preset: string;
  rule: string;
  actorUserId: string;
}): Promise<number> {
  return db.transaction(async (tx) => {
    // Serialize publications for one style so the next version is unique.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${input.slug}))`,
    );
    const [latest] = await tx
      .select({
        version: sql<number>`max(${artStyleTemplateVersions.version})`,
      })
      .from(artStyleTemplateVersions)
      .where(eq(artStyleTemplateVersions.slug, input.slug));
    const version =
      Math.max(ART_PROMPT_VERSION, Number(latest?.version ?? 0)) + 1;
    await tx.insert(artStyleTemplateVersions).values({
      slug: input.slug,
      version,
      preset: input.preset,
      rule: input.rule,
      createdBy: input.actorUserId,
    });
    await tx
      .insert(artStyleSettings)
      .values({
        slug: input.slug,
        activeVersion: version,
        updatedBy: input.actorUserId,
      })
      .onConflictDoUpdate({
        target: artStyleSettings.slug,
        set: {
          activeVersion: version,
          updatedBy: input.actorUserId,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "template.publish",
        targetType: "art_style",
        targetId: input.slug,
        details: JSON.stringify({ version }),
      }),
    );
    return version;
  });
}
