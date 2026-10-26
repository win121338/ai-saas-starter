import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db";
import {
  adminAuditEvents,
  adminMembers,
  artStyleSettings,
  artStyleTemplateVersions,
  systemSettings,
  users,
} from "@/db/schema";
import { closeDb, ensureTestDatabase } from "@/test/db";
import { getConfiguredArtStyle, resolveJobPrompt } from "@/lib/art/templates";
import { isAdminUser } from "./auth";
import {
  ANNOUNCEMENT_KEY,
  getModelEnabled,
  modelSettingKey,
  parseSystemSettingInput,
} from "./settings";
import { publishArtTemplate } from "./templates";

beforeAll(ensureTestDatabase, 60_000);
afterAll(closeDb);

describe("operations console boundaries", () => {
  it("grants access only to an explicit administrator member", async () => {
    const userId = `admin_test_${randomUUID()}`;
    await db
      .insert(users)
      .values({
        id: userId,
        name: "Admin Test",
        email: `${userId}@test.local`,
      });
    try {
      expect(await isAdminUser(userId)).toBe(false);
      await db.insert(adminMembers).values({ userId, grantedBy: "test" });
      expect(await isAdminUser(userId)).toBe(true);
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("publishes immutable style versions and preserves older job prompts", async () => {
    const slug = "clay-portrait";
    const actorUserId = `template_test_${randomUUID()}`;
    await db.delete(artStyleSettings).where(eq(artStyleSettings.slug, slug));
    await db
      .delete(artStyleTemplateVersions)
      .where(eq(artStyleTemplateVersions.slug, slug));
    try {
      const first = await publishArtTemplate({
        slug,
        preset: "Sculpt a clay scene.",
        rule: "Always use matte sculpted clay throughout.",
        actorUserId,
      });
      const second = await publishArtTemplate({
        slug,
        preset: "Create a warm clay scene.",
        rule: "Keep all subjects as rounded clay figures.",
        actorUserId,
      });
      expect(second).toBe(first + 1);
      expect((await getConfiguredArtStyle(slug))?.version).toBe(second);
      expect((await getConfiguredArtStyle(slug))?.preset).toBe(
        "Create a warm clay scene.",
      );
      expect(await resolveJobPrompt(slug, first)).toBe(
        "Sculpt a clay scene.\n\nAlways use matte sculpted clay throughout.",
      );
      expect(await resolveJobPrompt(slug, first, "Keep the smile.")).toBe(
        "Keep the smile.\n\nAlways use matte sculpted clay throughout.",
      );
      const audits = await db
        .select()
        .from(adminAuditEvents)
        .where(eq(adminAuditEvents.actorUserId, actorUserId));
      expect(audits).toHaveLength(2);
      expect(audits.every((event) => event.action === "template.publish")).toBe(
        true,
      );
    } finally {
      await db.delete(artStyleSettings).where(eq(artStyleSettings.slug, slug));
      await db
        .delete(artStyleTemplateVersions)
        .where(eq(artStyleTemplateVersions.slug, slug));
      await db
        .delete(adminAuditEvents)
        .where(eq(adminAuditEvents.actorUserId, actorUserId));
    }
  });

  it("accepts only safe settings and disables a model for new jobs", async () => {
    const model = "qwen-image-2.1-turbo";
    const key = modelSettingKey(model);
    expect(
      parseSystemSettingInput(ANNOUNCEMENT_KEY, "  Studio news  "),
    ).toEqual({ key: ANNOUNCEMENT_KEY, value: "Studio news" });
    expect(parseSystemSettingInput("DASHSCOPE_API_KEY", "secret")).toBeNull();
    expect(parseSystemSettingInput(key, "yes")).toBeNull();
    expect(parseSystemSettingInput(key, "false")).toEqual({
      key,
      value: "false",
    });
    await db
      .insert(systemSettings)
      .values({ key, value: "false", updatedBy: "test" })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: "false" },
      });
    try {
      expect(await getModelEnabled(model)).toBe(false);
    } finally {
      await db.delete(systemSettings).where(eq(systemSettings.key, key));
    }
  });
});
