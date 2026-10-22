import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

import { env } from "@/lib/env";

const root = path.join(process.cwd(), ".artora-private");

function safeKey(key: string) {
  if (!/^art\/[0-9a-f-]+\/(input|output)\.webp$/.test(key))
    throw new Error("Invalid asset key");
  return key;
}

export async function writeArtAsset(
  key: string,
  bytes: Buffer,
  overwrite = false,
) {
  safeKey(key);
  if (env.BLOB_READ_WRITE_TOKEN) {
    await put(key, bytes, {
      access: "private",
      contentType: "image/webp",
      token: env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: overwrite,
    });
  } else {
    const file = path.join(root, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes, { flag: overwrite ? "w" : "wx" });
  }
}

export async function readArtAsset(key: string): Promise<Buffer> {
  safeKey(key);
  if (env.BLOB_READ_WRITE_TOKEN) {
    const result = await get(key, {
      access: "private",
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) throw new Error("Asset missing");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  return readFile(path.join(root, key));
}

export async function deleteArtAsset(key: string): Promise<void> {
  safeKey(key);
  if (env.BLOB_READ_WRITE_TOKEN) {
    await del(key, { token: env.BLOB_READ_WRITE_TOKEN });
  } else {
    await unlink(path.join(root, key)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
