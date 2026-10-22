import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { InvalidArtImageError, normalizeArtImage } from "./image";

describe("private photo normalization", () => {
  it("rejects spoofed data and oversized uploads", async () => {
    await expect(
      normalizeArtImage(Buffer.from("not an image")),
    ).rejects.toBeInstanceOf(InvalidArtImageError);
    await expect(
      normalizeArtImage(Buffer.alloc(10 * 1024 * 1024 + 1)),
    ).rejects.toThrow("10 MB");
  });

  it("normalizes a real image to metadata-free WebP", async () => {
    const source = await sharp({
      create: { width: 32, height: 24, channels: 3, background: "#aabbcc" },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "private" } } })
      .toBuffer();
    const normalized = await normalizeArtImage(source);
    const metadata = await sharp(normalized.bytes).metadata();
    expect(normalized.mediaType).toBe("image/webp");
    expect([normalized.width, normalized.height]).toEqual([32, 24]);
    expect(metadata.exif).toBeUndefined();
  });

  it("refuses images beyond the pixel budget before decoding", async () => {
    const hugeHeader = await sharp({
      create: { width: 6000, height: 6000, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    await expect(normalizeArtImage(hugeHeader)).rejects.toBeInstanceOf(
      InvalidArtImageError,
    );
  });
});
