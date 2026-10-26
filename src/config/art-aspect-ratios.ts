import { z } from "zod";

export const artAspectRatioSchema = z.enum([
  "original",
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
]);
export type ArtAspectRatio = z.infer<typeof artAspectRatioSchema>;
export const ART_ASPECT_RATIOS = artAspectRatioSchema.options;

export function aspectRatioValue(ratio: ArtAspectRatio) {
  if (ratio === "original") return undefined;
  const [width, height] = ratio.split(":").map(Number);
  return width / height;
}
