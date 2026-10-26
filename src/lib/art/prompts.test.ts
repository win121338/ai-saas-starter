import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ART_PROMPT_MAX_LENGTH,
  ART_PROMPT_RECIPES,
} from "@/config/art-prompts";
import { artStyles } from "@/config/art-styles";
import {
  ART_PROMPT_VERSION,
  artPrompt,
  artPromptPreset,
  artStyleRule,
  parseArtPromptInput,
} from "./prompts";

describe("art style prompts", () => {
  it("covers every selectable style with the active prompt version", () => {
    expect(ART_PROMPT_VERSION).toBe(3);
    expect(Object.keys(ART_PROMPT_RECIPES[3].styles)).toEqual(
      artStyles.map((style) => style.slug),
    );
    expect(Object.keys(ART_PROMPT_RECIPES[3].rules ?? {})).toEqual(
      artStyles.map((style) => style.slug),
    );
    for (const style of artStyles) {
      const prompt = artPrompt(style.slug);
      expect(prompt).toContain("Use the uploaded photo");
      expect(prompt).toContain("STYLE RULE");
      expect(artStyleRule(style.slug)).toBeTruthy();
    }
  });

  it.each([
    ["oil-painting", "layered brushwork"],
    ["watercolor", "translucent washes"],
    ["pencil-sketch", "monochrome graphite drawing"],
    ["storybook", "storybook illustration"],
    ["vintage-poster", "screen-printed poster"],
    ["clay-portrait", "rounded matte forms"],
  ])("gives %s its own visual medium", (style, hallmark) => {
    expect(artPrompt(style)).toContain(hallmark);
  });

  it("preserves the original prompt for already queued version-1 jobs", () => {
    expect(artPrompt("watercolor", 1)).toBe(
      "Transform the supplied photo into a delicate watercolor painting with translucent pigment and natural paper texture. Preserve the main subject's identity, composition, pose, and recognizable features. Make a finished original artwork. No text, logos, watermark, or frame.",
    );
  });

  it("keeps version-2 jobs free of newly added style rules", () => {
    expect(artPrompt("watercolor", 2)).toContain("cold-press paper");
    expect(artPrompt("watercolor", 2)).not.toContain("STYLE RULE");
  });

  it("uses a custom prompt before the fixed selected-style rule", () => {
    const custom = "Keep the child's smile and use pale blue washes.";
    expect(artPrompt("watercolor", 3, custom)).toBe(
      `${custom}\n\n${artStyleRule("watercolor", 3)}`,
    );
    expect(artPrompt("watercolor", 3, custom)).not.toContain(
      artPromptPreset("watercolor", 3),
    );
  });

  it("validates edits and stores only a changed prompt", () => {
    const preset = artPromptPreset("watercolor");
    expect(parseArtPromptInput("watercolor", preset)).toEqual({
      promptOverride: null,
    });
    expect(parseArtPromptInput("watercolor", "  Keep the smile.  ")).toEqual({
      promptOverride: "Keep the smile.",
    });
    expect(parseArtPromptInput("watercolor", "ab")).toBeNull();
    expect(
      parseArtPromptInput("watercolor", "x".repeat(ART_PROMPT_MAX_LENGTH + 1)),
    ).toBeNull();
    expect(parseArtPromptInput("watercolor", null)).toBeNull();
  });

  it("rejects unknown styles and prompt versions", () => {
    expect(() => artPrompt("missing-style")).toThrow("Unknown art style");
    expect(() => artPrompt("watercolor", 999)).toThrow(
      "Unknown art prompt version",
    );
  });
});
