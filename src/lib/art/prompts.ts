import "server-only";

import { z } from "zod";

import { getArtStyle } from "@/config/art-styles";
import {
  ART_PROMPT_MAX_LENGTH,
  ART_PROMPT_RECIPES,
  ART_PROMPT_VERSION,
} from "@/config/art-prompts";

export { ART_PROMPT_VERSION };

function recipeFor(slug: string, version: number) {
  const recipe = ART_PROMPT_RECIPES[version];
  if (!recipe) throw new Error("Unknown art prompt version");
  if (!getArtStyle(slug) || !Object.hasOwn(recipe.styles, slug))
    throw new Error("Unknown art style");
  return recipe;
}

export function artPromptPreset(
  slug: string,
  version: number = ART_PROMPT_VERSION,
): string {
  const recipe = recipeFor(slug, version);
  return `${recipe.prefix}${recipe.styles[slug]}${recipe.suffix}`;
}

export function artStyleRule(
  slug: string,
  version: number = ART_PROMPT_VERSION,
): string | null {
  return recipeFor(slug, version).rules?.[slug] ?? null;
}

export function artPrompt(
  slug: string,
  version: number = ART_PROMPT_VERSION,
  override?: string | null,
): string {
  const prompt = override ?? artPromptPreset(slug, version);
  const rule = artStyleRule(slug, version);
  return rule ? `${prompt}\n\n${rule}` : prompt;
}

const promptInput = z.string().trim().min(3).max(ART_PROMPT_MAX_LENGTH);

export function parseArtPromptInput(
  slug: string,
  value: unknown,
  preset: string = artPromptPreset(slug),
) {
  const parsed = promptInput.safeParse(value);
  if (!parsed.success) return null;
  return {
    promptOverride: parsed.data === preset ? null : parsed.data,
  };
}
