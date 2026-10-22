import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { artAssets } from "@/db/schema";
import { deleteArtAsset } from "./storage";

/** Called before Better Auth cascades the user's asset rows away. */
export async function deleteArtAssetsForUser(userId: string) {
  const assets = await db
    .select({ key: artAssets.storageKey })
    .from(artAssets)
    .where(eq(artAssets.userId, userId));
  for (const asset of assets) await deleteArtAsset(asset.key);
}
