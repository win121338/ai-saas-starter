import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { artModels, getArtModel } from "@/config/image-model-catalog";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";

export const ANNOUNCEMENT_KEY = "site.announcement";

export function modelSettingKey(modelId: string): string {
  return `model.${modelId}.enabled`;
}

export function parseSystemSettingInput(key: unknown, value: unknown) {
  const parsedKey = z.string().safeParse(key);
  if (!parsedKey.success) return null;
  if (parsedKey.data === ANNOUNCEMENT_KEY) {
    const parsed = z.string().trim().max(500).safeParse(value);
    return parsed.success
      ? { key: ANNOUNCEMENT_KEY, value: parsed.data }
      : null;
  }
  const modelId = artModels.find(
    (model) => modelSettingKey(model.id) === parsedKey.data,
  )?.id;
  if (!modelId || !getArtModel(modelId)) return null;
  const parsed = z.enum(["true", "false"]).safeParse(value);
  return parsed.success
    ? { key: modelSettingKey(modelId), value: parsed.data }
    : null;
}

export async function getSiteAnnouncement(): Promise<string> {
  const [setting] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, ANNOUNCEMENT_KEY))
    .limit(1);
  return setting?.value ?? "";
}

export async function getModelEnabled(modelId: string): Promise<boolean> {
  if (!getArtModel(modelId)) return false;
  const [setting] = await db
    .select({ value: systemSettings.value })
    .from(systemSettings)
    .where(eq(systemSettings.key, modelSettingKey(modelId)))
    .limit(1);
  return setting?.value !== "false";
}

export async function listModelSettings(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(systemSettings);
  const settings = new Map(rows.map((row) => [row.key, row.value]));
  return Object.fromEntries(
    artModels.map((model) => [
      model.id,
      settings.get(modelSettingKey(model.id)) !== "false",
    ]),
  );
}
