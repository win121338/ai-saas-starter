import "server-only";

import { and, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditEvents,
  creativeTemplates,
  creativeTemplateVersions,
} from "@/db/schema";
import { getArtStyle } from "@/config/art-styles";
import { artModels } from "@/config/image-model-catalog";
import { auditValues } from "@/lib/admin/audit";
import { creativeDefinition } from "./schema";
import { artModelAvailable } from "@/lib/art/provider";
import { listModelSettings } from "@/lib/admin/settings";

export async function saveCreativeDraft(
  input: unknown,
  actorUserId: string,
  expectedUpdatedAt?: string,
) {
  const definition = creativeDefinition.parse(input);
  if (getArtStyle(definition.id))
    throw new Error("Legacy style IDs cannot be reused.");
  const models: string[] = [
    ...artModels.map((model) => model.id),
    "fal-ai/flux-pro/kontext",
  ];
  if (definition.recipe.modelIds.some((id) => !models.includes(id)))
    throw new Error("Unknown image model.");
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`creative:${definition.id}`}))`,
    );
    const [existing] = await tx
      .select()
      .from(creativeTemplates)
      .where(eq(creativeTemplates.id, definition.id));
    if (
      expectedUpdatedAt &&
      existing?.updatedAt.toISOString() !== expectedUpdatedAt
    )
      throw new Error(
        "This draft changed in another tab. Reload before saving.",
      );
    await tx
      .insert(creativeTemplates)
      .values({ id: definition.id, draft: definition, updatedBy: actorUserId })
      .onConflictDoUpdate({
        target: creativeTemplates.id,
        set: {
          draft: definition,
          updatedBy: actorUserId,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId,
        action: "creative.draft",
        targetType: "creative_template",
        targetId: definition.id,
      }),
    );
    return definition.id;
  });
}

/** Preview snapshots are immutable too, but do not change the active version. */
export async function publishCreativeTemplate(
  id: string,
  actorUserId: string,
  preview = false,
  expectedDraft?: unknown,
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`creative:${id}`}))`,
    );
    const [row] = await tx
      .select()
      .from(creativeTemplates)
      .where(eq(creativeTemplates.id, id));
    if (!row) throw new Error("Template not found.");
    const definition = creativeDefinition.parse(row.draft);
    if (
      expectedDraft &&
      JSON.stringify(creativeDefinition.parse(expectedDraft)) !==
        JSON.stringify(definition)
    )
      throw new Error(
        "The draft changed before publication. Reload and try again.",
      );
    const enabled = await listModelSettings();
    if (
      !definition.recipe.modelIds.some(
        (id) => artModelAvailable(id) && enabled[id] !== false,
      )
    )
      throw new Error("No compatible image model is currently available.");
    const [latest] = await tx
      .select({ version: max(creativeTemplateVersions.version) })
      .from(creativeTemplateVersions)
      .where(eq(creativeTemplateVersions.templateId, id));
    const version = (latest?.version ?? 0) + 1;
    await tx
      .insert(creativeTemplateVersions)
      .values({ templateId: id, version, definition, createdBy: actorUserId });
    if (!preview)
      await tx
        .update(creativeTemplates)
        .set({
          activeVersion: version,
          updatedBy: actorUserId,
          updatedAt: new Date(),
        })
        .where(eq(creativeTemplates.id, id));
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId,
        action: preview ? "creative.preview" : "creative.publish",
        targetType: "creative_template",
        targetId: id,
        details: JSON.stringify({ version }),
      }),
    );
    return version;
  });
}

export async function setCreativeAvailability(
  input: {
    id: string;
    displayEnabled: boolean;
    creationEnabled: boolean;
    featured: boolean;
    sortOrder: number;
  },
  actorUserId: string,
) {
  await db.transaction(async (tx) => {
    // Serialize the unique featured slot as well as per-template availability.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('creative:featured'))`,
    );
    const [row] = await tx
      .select()
      .from(creativeTemplates)
      .where(eq(creativeTemplates.id, input.id));
    if (!row) throw new Error("Template not found.");
    if ((input.displayEnabled || input.creationEnabled) && !row.activeVersion)
      throw new Error("Publish a version before making it available.");
    if (input.featured && !input.displayEnabled)
      throw new Error("A featured template must be visible.");
    if (input.featured)
      await tx
        .update(creativeTemplates)
        .set({ featured: false })
        .where(eq(creativeTemplates.featured, true));
    await tx
      .update(creativeTemplates)
      .set({ ...input, updatedBy: actorUserId, updatedAt: new Date() })
      .where(eq(creativeTemplates.id, input.id));
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId,
        action: "creative.availability",
        targetType: "creative_template",
        targetId: input.id,
        details: JSON.stringify(input),
      }),
    );
  });
}

export async function activateCreativeVersion(
  id: string,
  version: number,
  actorUserId: string,
) {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`creative:${id}`}))`,
    );
    const [row] = await tx
      .select()
      .from(creativeTemplateVersions)
      .where(
        and(
          eq(creativeTemplateVersions.templateId, id),
          eq(creativeTemplateVersions.version, version),
        ),
      );
    if (!row) throw new Error("Version not found.");
    creativeDefinition.parse(row.definition);
    await tx
      .update(creativeTemplates)
      .set({
        activeVersion: version,
        updatedBy: actorUserId,
        updatedAt: new Date(),
      })
      .where(eq(creativeTemplates.id, id));
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId,
        action: "creative.activate",
        targetType: "creative_template",
        targetId: id,
        details: JSON.stringify({ version }),
      }),
    );
  });
}
