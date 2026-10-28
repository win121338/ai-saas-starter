import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { creativeTemplateMedia } from "@/db/schema";
import { normalizeArtImage } from "@/lib/art/image";
import { env } from "@/lib/env";

const root = path.join(process.cwd(), ".creative-media");

export async function uploadCreativeMedia(
  file: File,
  actorUserId: string,
  usage: "case" | "reference" = "case",
) {
  const image = await normalizeArtImage(file);
  const id = randomUUID();
  const key = `${usage === "reference" ? "creative-references" : "creative"}/${id}.webp`;
  let storageKey = key;
  if (env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, image.bytes, {
      access: "private",
      contentType: "image/webp",
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    storageKey = blob.url;
  } else {
    if (env.NODE_ENV === "production")
      throw new Error(
        "Configure image storage before uploading template media.",
      );
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, `${id}.webp`), image.bytes, { flag: "wx" });
  }
  await db.insert(creativeTemplateMedia).values({
    id,
    storageKey,
    width: image.width,
    height: image.height,
    createdBy: actorUserId,
  });
  return {
    src:
      usage === "reference"
        ? `/creative-references/uploads/${id}.webp`
        : `/template-media/${id}.webp`,
    width: image.width,
    height: image.height,
  };
}

export async function readCreativeMedia(id: string, publicOnly = false) {
  const [row] = await db
    .select()
    .from(creativeTemplateMedia)
    .where(eq(creativeTemplateMedia.id, id));
  if (!row) return null;
  const storagePath = row.storageKey.startsWith("https://")
    ? new URL(row.storageKey).pathname.slice(1)
    : row.storageKey;
  if (publicOnly && storagePath.startsWith("creative-references/")) return null;
  if (row.storageKey.startsWith("https://")) {
    const result = await get(row.storageKey, {
      access: "private",
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) return null;
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }
  return new Uint8Array(await readFile(path.join(root, `${id}.webp`)));
}
