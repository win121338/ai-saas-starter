import { describe, expect, it } from "vitest";
import {
  ART_ASPECT_RATIOS,
  artCanvasSize,
  artCanvasSizeString,
  aspectRatioValue,
} from "./art-aspect-ratios";

describe("common output canvases", () => {
  it.each(ART_ASPECT_RATIOS)(
    "keeps %s near the requested ratio within each existing pixel tier",
    (ratio) => {
      const value = aspectRatioValue(ratio) ?? 4 / 3;
      for (const pixels of [1536 ** 2, 2048 ** 2]) {
        const canvas = artCanvasSize(
          { width: value * 100, height: 100 },
          pixels,
        );
        expect(canvas.width * canvas.height).toBeLessThanOrEqual(pixels);
        expect(canvas.width * canvas.height).toBeGreaterThan(921600);
        expect(canvas.width % 16).toBe(0);
        expect(canvas.height % 16).toBe(0);
        expect(Math.abs(canvas.width / canvas.height - value)).toBeLessThan(
          0.02,
        );
      }
    },
  );
  it("uses provider-specific separators and rejects out-of-range shapes", () => {
    expect(artCanvasSizeString({ width: 1, height: 1 }, 1536 ** 2, "x")).toBe(
      "1536x1536",
    );
    expect(artCanvasSizeString({ width: 1, height: 1 }, 2048 ** 2, "*")).toBe(
      "2048*2048",
    );
    expect(() => artCanvasSize({ width: 0, height: 1 }, 2048 ** 2)).toThrow();
    expect(() => artCanvasSize({ width: 100, height: 1 }, 2048 ** 2)).toThrow();
  });
});
