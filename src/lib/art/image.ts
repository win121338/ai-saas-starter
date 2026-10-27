import sharp, { type Metadata } from "sharp";
import {
  aspectRatioValue,
  type ArtAspectRatio,
} from "@/config/art-aspect-ratios";

const MAX_INPUT = 10 * 1024 * 1024;
const MAX_PIXELS = 30_000_000;
const FORMATS = new Set(["jpeg", "png", "webp"]);

export class InvalidArtImageError extends Error {}

export async function normalizeArtImage(
  file: File | Buffer,
  maxBytes = MAX_INPUT,
  aspectRatio: ArtAspectRatio | number = "original",
) {
  const bytes = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await file.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) {
    throw new InvalidArtImageError(
      `Choose an image smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }
  let metadata: Metadata;
  try {
    metadata = await sharp(bytes, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new InvalidArtImageError("This image could not be read.");
  }
  if (
    !metadata.format ||
    !FORMATS.has(metadata.format) ||
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > MAX_PIXELS
  ) {
    throw new InvalidArtImageError(
      "Choose a valid JPEG, PNG, or WebP image under 30 megapixels.",
    );
  }
  try {
    const ratio =
      typeof aspectRatio === "number"
        ? aspectRatio
        : aspectRatioValue(aspectRatio);
    if (ratio !== undefined && (!Number.isFinite(ratio) || ratio <= 0))
      throw new InvalidArtImageError("Choose a valid photo ratio.");
    const rotatedWidth = metadata.autoOrient?.width ?? metadata.width;
    const rotatedHeight = metadata.autoOrient?.height ?? metadata.height;
    const cropWidth = ratio
      ? Math.min(rotatedWidth, Math.floor(rotatedHeight * ratio))
      : rotatedWidth;
    const cropHeight = ratio
      ? Math.min(rotatedHeight, Math.floor(rotatedWidth / ratio))
      : rotatedHeight;
    const pipeline = sharp(bytes, { limitInputPixels: MAX_PIXELS }).rotate();
    if (ratio)
      pipeline.extract({
        left: Math.floor((rotatedWidth - cropWidth) / 2),
        top: Math.floor((rotatedHeight - cropHeight) / 2),
        width: Math.max(1, cropWidth),
        height: Math.max(1, cropHeight),
      });
    const { data, info } = await pipeline
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      bytes: data,
      mediaType: "image/webp" as const,
      width: info.width,
      height: info.height,
    };
  } catch {
    throw new InvalidArtImageError("This image could not be processed.");
  }
}
