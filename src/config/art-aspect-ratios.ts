import { z } from "zod";

export const artAspectRatioSchema = z.enum([
  "1:1",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "2:3",
  "3:2",
  "9:16",
  "16:9",
  "original",
]);
export type ArtAspectRatio = z.infer<typeof artAspectRatioSchema>;
export const ART_ASPECT_RATIOS = artAspectRatioSchema.options;

export const ART_ASPECT_RATIO_LABELS: Record<ArtAspectRatio, string> = {
  original: "Keep original",
  "1:1": "Square",
  "3:4": "Portrait",
  "4:3": "Landscape",
  "2:3": "Poster",
  "3:2": "Photography",
  "4:5": "Social portrait",
  "5:4": "Social landscape",
  "9:16": "Phone portrait",
  "16:9": "Wide cover",
};

export type ArtCanvas = { width: number; height: number };

/** Match each provider's existing pixel tier without increasing it for wide/tall images. */
export function artCanvasSize(canvas: ArtCanvas, pixels: number): ArtCanvas {
  const ratio = canvas.width / canvas.height;
  if (!Number.isFinite(ratio) || ratio < 1 / 8 || ratio > 8)
    throw new Error("Image ratio must be between 1:8 and 8:1.");
  if (Number.isInteger(canvas.width) && Number.isInteger(canvas.height)) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const divisor = gcd(canvas.width, canvas.height);
    const width = canvas.width / divisor;
    const height = canvas.height / divisor;
    const scale = Math.floor(Math.sqrt(pixels / (width * height)) / 16) * 16;
    if (scale >= 16) return { width: width * scale, height: height * scale };
  }
  return {
    width: Math.floor(Math.sqrt(pixels * ratio) / 16) * 16,
    height: Math.floor(Math.sqrt(pixels / ratio) / 16) * 16,
  };
}

export function artCanvasSizeString(
  canvas: ArtCanvas,
  pixels: number,
  separator: "*" | "x",
) {
  const size = artCanvasSize(canvas, pixels);
  return `${size.width}${separator}${size.height}`;
}

export function aspectRatioValue(ratio: ArtAspectRatio) {
  if (ratio === "original") return undefined;
  const [width, height] = ratio.split(":").map(Number);
  return width / height;
}
