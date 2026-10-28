import "server-only";

import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { creativeReference, type CreativeDefinition } from "./schema";
import { readCreativeMedia } from "./media";

/** Read an immutable local reference or operator-uploaded media, never a remote URL. */
export async function readStyleReference(input: unknown): Promise<Buffer> {
  const reference = creativeReference.parse(input);
  let bytes: Buffer;
  const upload = reference.src.match(
    /^\/creative-references\/uploads\/([0-9a-f-]{36})\.webp$/,
  );
  if (upload) {
    const stored = await readCreativeMedia(upload[1]);
    if (!stored)
      throw new Error("The template style reference is unavailable.");
    bytes = Buffer.from(stored);
  } else {
    const [, templateId, filename] = reference.src.split("/").slice(1);
    const root = await realpath(
      path.join(process.cwd(), "content/case-templates"),
    );
    const target = await realpath(
      path.join(root, templateId, "references", filename),
    );
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      throw new Error("Invalid style reference path.");
    bytes = await readFile(target);
    if (
      createHash("sha256").update(bytes).digest("hex") !== filename.slice(0, -5)
    )
      throw new Error(
        "The template style reference has changed. Publish a new reference version.",
      );
  }
  if (!bytes.length || bytes.length > 10 * 1024 * 1024)
    throw new Error("The template style reference is too large.");
  const metadata = await sharp(bytes, {
    limitInputPixels: 30_000_000,
  }).metadata();
  if (
    metadata.format !== "webp" ||
    metadata.width !== reference.width ||
    metadata.height !== reference.height
  )
    throw new Error("The template style reference metadata does not match.");
  return bytes;
}

export async function readRecipeReference(definition: CreativeDefinition) {
  return definition.recipe.referenceImage
    ? readStyleReference(definition.recipe.referenceImage)
    : undefined;
}
