import { readFileSync } from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./media", () => ({ readCreativeMedia: vi.fn(async () => null) }));
import { readRecipeReference, readStyleReference } from "./references";
import { creativeDefinition } from "./schema";

describe("versioned style reference assets", () => {
  it.each(["indie-ink-portrait", "retro-grain-poster", "cool-blue-glitch"])(
    "reads the immutable reference of %s",
    async (id) => {
      const definition = creativeDefinition.parse(
        JSON.parse(
          readFileSync(
            `content/case-templates/${id}/creative-template.json`,
            "utf8",
          ),
        ),
      );
      const image = definition.recipe.referenceImage!;
      const bytes = await readRecipeReference(definition);
      expect(bytes).toEqual(
        readFileSync(
          `content/case-templates/${id}/references/${image.src.split("/").at(-1)}`,
        ),
      );
      await expect(
        readStyleReference({ ...image, width: image.width + 1 }),
      ).rejects.toThrow("metadata");
    },
    15000,
  );
  it("refuses changed bytes instead of silently changing an immutable reference", async () => {
    const hash = randomBytes(32).toString("hex");
    const filename = `content/case-templates/indie-ink-portrait/references/${hash}.webp`;
    await writeFile(filename, Buffer.from("changed-reference-bytes"), {
      flag: "wx",
    });
    try {
      await expect(
        readStyleReference({
          src: `/creative-references/indie-ink-portrait/${hash}.webp`,
          width: 600,
          height: 400,
        }),
      ).rejects.toThrow("has changed");
    } finally {
      await unlink(filename);
    }
  });
  it("does not fetch or invent a reference for a historical single-photo recipe", async () => {
    const definition = creativeDefinition.parse(
      JSON.parse(
        readFileSync(
          "content/case-templates/blue-paper-comic/creative-template.json",
          "utf8",
        ),
      ),
    );
    expect(await readRecipeReference(definition)).toBeUndefined();
  });
  it("fails closed for missing uploaded media and unsafe paths", async () => {
    await expect(
      readStyleReference({
        src: "/creative-references/uploads/00000000-0000-0000-0000-000000000000.webp",
        width: 600,
        height: 400,
      }),
    ).rejects.toThrow("unavailable");
    await expect(
      readStyleReference({
        src: "/creative-references/../../.env",
        width: 600,
        height: 400,
      }),
    ).rejects.toThrow();
  });
});
