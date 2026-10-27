import "server-only";

import { and, eq } from "drizzle-orm";

import { artStyles, type ArtStyle } from "@/config/art-styles";
import { ART_PROMPT_VERSION } from "@/config/art-prompts";
import { db } from "@/db";
import { artStyleSettings, artStyleTemplateVersions } from "@/db/schema";
import { artPrompt, artPromptPreset, artStyleRule } from "./prompts";
import { getCreativeVersion } from "@/lib/creative/catalog";
import { creativeInstruction, creativeSubmission } from "@/lib/creative/schema";
import { getArtStyle } from "@/config/art-styles";

export type ConfiguredArtStyle = ArtStyle & {
  enabled: boolean;
  version: number;
  preset: string;
  rule: string;
  sampleImageUrl: string | null;
};

export async function listConfiguredArtStyles(): Promise<ConfiguredArtStyle[]> {
  const [settings, templates] = await Promise.all([
    db.select().from(artStyleSettings),
    db.select().from(artStyleTemplateVersions),
  ]);
  const settingsBySlug = new Map(settings.map((row) => [row.slug, row]));
  const templatesByKey = new Map(
    templates.map((row) => [`${row.slug}:${row.version}`, row]),
  );
  return artStyles.map((style) => {
    const setting = settingsBySlug.get(style.slug);
    const active = setting?.activeVersion
      ? templatesByKey.get(`${style.slug}:${setting.activeVersion}`)
      : undefined;
    return {
      ...style,
      name: setting?.displayName || style.name,
      enabled: setting?.enabled ?? true,
      version: active?.version ?? ART_PROMPT_VERSION,
      preset: active?.preset ?? artPromptPreset(style.slug),
      rule: active?.rule ?? artStyleRule(style.slug) ?? "",
      sampleImageUrl: setting?.sampleImageUrl ?? null,
    };
  });
}

export async function getConfiguredArtStyle(slug: string) {
  return (await listConfiguredArtStyles()).find((style) => style.slug === slug);
}

export async function resolveJobPrompt(
  slug: string,
  version: number,
  override?: string | null,
): Promise<string> {
  if (!getArtStyle(slug)) {
    const definition = await getCreativeVersion(slug, version);
    if (!definition) throw new Error("Creative template version not found");
    const submission = creativeSubmission(override);
    return submission
      ? creativeInstruction(definition, submission.options, submission.canvas)
      : creativeInstruction(definition, override ? JSON.parse(override) : {});
  }
  if (version <= ART_PROMPT_VERSION) return artPrompt(slug, version, override);
  const [template] = await db
    .select({
      preset: artStyleTemplateVersions.preset,
      rule: artStyleTemplateVersions.rule,
    })
    .from(artStyleTemplateVersions)
    .where(
      and(
        eq(artStyleTemplateVersions.slug, slug),
        eq(artStyleTemplateVersions.version, version),
      ),
    )
    .limit(1);
  if (!template) throw new Error("Published art template not found");
  return `${override ?? template.preset}\n\n${template.rule}`;
}
