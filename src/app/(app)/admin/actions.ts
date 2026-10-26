"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getArtStyle } from "@/config/art-styles";
import { db } from "@/db";
import {
  adminAuditEvents,
  adminMembers,
  artStyleSettings,
  systemSettings,
  users,
} from "@/db/schema";
import { auditValues } from "@/lib/admin/audit";
import { isBootstrapOwner, requireAdmin } from "@/lib/admin/auth";
import { parseSystemSettingInput } from "@/lib/admin/settings";
import { publishArtTemplate } from "@/lib/admin/templates";
import { localizedHref } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const templateInput = z.object({
  slug: z.string(),
  preset: z.string().trim().min(3).max(2_000),
  rule: z.string().trim().min(20).max(1_000),
});

const styleInput = z.object({
  slug: z.string(),
  displayName: z.string().trim().min(2).max(60),
  sampleImageUrl: z.union([
    z.literal(""),
    z
      .url()
      .startsWith("https://")
      .max(600)
      .refine((value) => {
        const url = new URL(value);
        return !url.username && !url.password && !url.search && !url.hash;
      }),
  ]),
  enabled: z.boolean(),
});

async function adminRedirect(
  section: string,
  result: "saved" | "invalid",
  style?: string,
) {
  const locale = await getLocale();
  redirect(
    localizedHref(
      `/admin/${section}?result=${result}${style ? `&style=${encodeURIComponent(style)}` : ""}`,
      locale,
    ),
  );
}

function revalidateStyleRoutes() {
  for (const path of [
    "/",
    "/zh",
    "/styles",
    "/zh/styles",
    "/generate",
    "/zh/generate",
    "/admin/templates",
    "/zh/admin/templates",
  ])
    revalidatePath(path);
}

export async function publishTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const parsed = templateInput.safeParse({
    slug: formData.get("slug"),
    preset: formData.get("preset"),
    rule: formData.get("rule"),
  });
  if (!parsed.success || !getArtStyle(parsed.data.slug))
    return adminRedirect("templates", "invalid");
  const { slug, preset, rule } = parsed.data;
  await publishArtTemplate({
    slug,
    preset,
    rule,
    actorUserId: session.user.id,
  });
  revalidateStyleRoutes();
  return adminRedirect("templates", "saved", slug);
}

export async function updateStyleAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const enabledInput = z.enum(["on"]).nullable().safeParse(formData.get("enabled"));
  if (!enabledInput.success) return adminRedirect("templates", "invalid");
  const parsed = styleInput.safeParse({
    slug: formData.get("slug"),
    displayName: formData.get("displayName"),
    sampleImageUrl: formData.get("sampleImageUrl"),
    enabled: enabledInput.data === "on",
  });
  if (!parsed.success || !getArtStyle(parsed.data.slug))
    return adminRedirect("templates", "invalid");
  const { slug, displayName, sampleImageUrl, enabled } = parsed.data;
  await db.transaction(async (tx) => {
    await tx
      .insert(artStyleSettings)
      .values({
        slug,
        displayName,
        sampleImageUrl: sampleImageUrl || null,
        enabled,
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: artStyleSettings.slug,
        set: {
          displayName,
          sampleImageUrl: sampleImageUrl || null,
          enabled,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId: session.user.id,
        action: "style.update",
        targetType: "art_style",
        targetId: slug,
        details: JSON.stringify({ enabled }),
      }),
    );
  });
  revalidateStyleRoutes();
  return adminRedirect("templates", "saved", slug);
}

export async function saveSystemSettingAction(
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin();
  const input = parseSystemSettingInput(
    formData.get("key"),
    formData.get("value"),
  );
  if (!input) return adminRedirect("settings", "invalid");
  await db.transaction(async (tx) => {
    await tx
      .insert(systemSettings)
      .values({ ...input, updatedBy: session.user.id })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: input.value,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditEvents).values(
      auditValues({
        actorUserId: session.user.id,
        action: "setting.update",
        targetType: "system_setting",
        targetId: input.key,
        details: input.key.endsWith(".enabled") ? input.value : undefined,
      }),
    );
  });
  for (const path of [
    "/generate",
    "/zh/generate",
    "/admin/settings",
    "/zh/admin/settings",
  ])
    revalidatePath(path);
  return adminRedirect("settings", "saved");
}

export async function grantAdminAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  if (!isBootstrapOwner(session.user.id))
    return adminRedirect("members", "invalid");
  const email = z.email().trim().toLowerCase().safeParse(formData.get("email"));
  if (!email.success) return adminRedirect("members", "invalid");
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.data))
    .limit(1);
  if (!user) return adminRedirect("members", "invalid");
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(adminMembers)
      .values({ userId: user.id, grantedBy: session.user.id })
      .onConflictDoNothing()
      .returning({ userId: adminMembers.userId });
    if (inserted.length)
      await tx.insert(adminAuditEvents).values(
        auditValues({
          actorUserId: session.user.id,
          action: "admin.grant",
          targetType: "user",
          targetId: user.id,
        }),
      );
  });
  revalidatePath("/admin/members");
  revalidatePath("/zh/admin/members");
  return adminRedirect("members", "saved");
}
