import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  creativeDefinition,
  creativeInstruction,
  creativeOptions,
  creativeSubmission,
} from "./schema";

export const fixture = () =>
  creativeDefinition.parse(
    JSON.parse(
      readFileSync(
        "content/case-templates/blue-paper-comic/creative-template.json",
        "utf8",
      ),
    ),
  );

describe("creative template import and options", () => {
  it("validates the new reference packages and fixes input roles without changing historical recipes", () => {
    expect(creativeInstruction(fixture(), {})).not.toContain(
      "INPUT IMAGE ROLES",
    );
    for (const id of [
      "indie-ink-portrait",
      "retro-grain-poster",
      "cool-blue-glitch",
    ]) {
      const definition = creativeDefinition.parse(
        JSON.parse(
          readFileSync(
            `content/case-templates/${id}/creative-template.json`,
            "utf8",
          ),
        ),
      );
      expect(definition.recipe.inputMode).toBe("photo-with-reference");
      expect(definition.recipe.referenceImage?.src).toMatch(
        /\/creative-references\/.+\/[a-f0-9]{64}\.webp$/,
      );
      const instruction = creativeInstruction(definition, {});
      expect(instruction).toContain("Image 1 is the style reference only");
      expect(instruction).toContain("Image 2 is the user's photo");
      expect(definition.recipe.tested).toBe(false);
    }
  });
  it("rejects missing references, ambiguous modes and arbitrary reference paths", () => {
    const item = fixture();
    item.recipe.inputMode = "photo-with-reference";
    expect(creativeDefinition.safeParse(item).success).toBe(false);
    item.recipe.referenceImage = {
      src: `/creative-references/indie-ink-portrait/${"a".repeat(64)}.webp`,
      width: 600,
      height: 400,
    };
    expect(creativeDefinition.safeParse(item).success).toBe(true);
    item.recipe.inputMode = "single-photo";
    expect(creativeDefinition.safeParse(item).success).toBe(false);
    item.recipe.inputMode = "photo-with-reference";
    for (const src of [
      "https://attacker.test/reference.webp",
      "/creative-references/../secret.webp",
      "/cases/case1/refer.png",
    ]) {
      item.recipe.referenceImage.src = src;
      expect(creativeDefinition.safeParse(item).success).toBe(false);
    }
  });
  it("retains historical instructions and decodes new canvas settings separately", () => {
    const item = fixture();
    const original = creativeInstruction(item, { title: "HELLO" });
    expect(original).toContain(item.recipe.prompt);
    expect(creativeSubmission("Keep the portrait in oils")).toBeNull();
    expect(creativeSubmission('{"title":"HELLO"}')).toBeNull();
    const next = creativeInstruction(
      item,
      { title: "HELLO" },
      { width: 3, height: 4 },
    );
    expect(next).toContain("3:4 (width:height)");
    expect(next).not.toContain("输出方图");
    expect(next).toContain("#316793");
    expect(item.recipe.prompt).toContain("输出方图");
    expect(() =>
      creativeSubmission('{"formatVersion":1,"canvas":{"width":0,"height":5}}'),
    ).toThrow();
  });
  it("validates all three prepared packages as single-photo adaptations", () => {
    for (const id of [
      "blue-paper-comic",
      "color-block-manga",
      "bold-marker-doodle",
    ]) {
      const item = creativeDefinition.parse(
        JSON.parse(
          readFileSync(
            `content/case-templates/${id}/creative-template.json`,
            "utf8",
          ),
        ),
      );
      expect(item.id).toBe(id);
      expect(item.recipe.inputMode).toBe("single-photo");
      expect(item.recipe.tested).toBe(false);
      expect(
        item.cases.every((art) => art.provenance === "collected-reference"),
      ).toBe(true);
    }
  });
  it("rejects missing covers, duplicate cases and unapproved image paths", () => {
    const item = fixture();
    expect(
      creativeDefinition.safeParse({ ...item, coverCaseId: "missing" }).success,
    ).toBe(false);
    expect(
      creativeDefinition.safeParse({
        ...item,
        cases: [...item.cases, item.cases[0]],
      }).success,
    ).toBe(false);
    item.cases[0].after.src = "https://attacker.test/private";
    expect(creativeDefinition.safeParse(item).success).toBe(false);
  });
  it("accepts only declared bounded parameters without replacing the fixed recipe", () => {
    const item = fixture();
    expect(creativeOptions(item, {})).toEqual({ title: "" });
    expect(() =>
      creativeOptions(item, { prompt: "replace the recipe" }),
    ).toThrow();
    expect(() => creativeOptions(item, { title: "a".repeat(41) })).toThrow();
    const prompt = creativeInstruction(item, { title: "SLOW SIP" });
    expect(prompt).toContain(item.recipe.prompt);
    expect(prompt).toContain(item.recipe.rule);
    expect(prompt).toContain('"title":"SLOW SIP"');
  });
  it("requires a compatible default model and evidence for a tested claim", () => {
    const item = fixture();
    item.recipe.defaultModel = "unknown";
    expect(creativeDefinition.safeParse(item).success).toBe(false);
    item.recipe.defaultModel = item.recipe.modelIds[0];
    item.recipe.tested = true;
    expect(creativeDefinition.safeParse(item).success).toBe(false);
  });
});
