"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { GENERATION_COST_CREDITS } from "@/config/plans";
import { getArtStyle } from "@/config/art-styles";
import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { InsufficientCreditsError, spendCredits } from "@/lib/credits";
import { artProviderConfig } from "@/lib/art/provider";
import { ART_PROMPT_VERSION } from "@/lib/art/prompts";
import { InvalidArtImageError, normalizeArtImage } from "@/lib/art/image";
import { processOneArtJob } from "@/lib/art/jobs";
import { deleteArtAsset, writeArtAsset } from "@/lib/art/storage";
import { limitGeneration } from "@/lib/rate-limit";

export type ArtActionState = { ok: boolean; error?: string; jobId?: string };

export async function createArtJobAction(
  _prev: ArtActionState,
  formData: FormData,
): Promise<ArtActionState> {
  const user = (await requireSession()).user;
  const requestKey = z.uuid().safeParse(formData.get("requestKey"));
  const style = z.string().safeParse(formData.get("style"));
  if (!requestKey.success || !style.success || !getArtStyle(style.data))
    return { ok: false, error: "Choose a valid style and try again." };
  const [existing] = await db
    .select({ id: artJobs.id })
    .from(artJobs)
    .where(
      and(eq(artJobs.userId, user.id), eq(artJobs.requestKey, requestKey.data)),
    )
    .limit(1);
  if (existing) return { ok: true, jobId: existing.id };
  const file = formData.get("photo");
  if (!(file instanceof File))
    return { ok: false, error: "Choose a photo first." };
  const rate = await limitGeneration(user.id);
  if (!rate.success)
    return { ok: false, error: "Please wait a minute before trying again." };
  let image;
  try {
    image = await normalizeArtImage(file);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof InvalidArtImageError
          ? error.message
          : "Image processing failed.",
    };
  }
  const assetId = randomUUID();
  const jobId = randomUUID();
  const key = `art/${assetId}/input.webp`;
  const provider = artProviderConfig();
  await writeArtAsset(key, image.bytes);
  let inserted = false;
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(artAssets)
        .values({
          id: assetId,
          userId: user.id,
          kind: "input",
          storageKey: key,
          mediaType: image.mediaType,
          sizeBytes: image.bytes.length,
          width: image.width,
          height: image.height,
          expiresAt: new Date(Date.now() + 30 * 86_400_000),
        });
      const result = await tx
        .insert(artJobs)
        .values({
          id: jobId,
          userId: user.id,
          requestKey: requestKey.data,
          inputAssetId: assetId,
          styleSlug: style.data,
          styleVersion: ART_PROMPT_VERSION,
          provider: provider.provider,
          model: provider.model,
          costCredits: GENERATION_COST_CREDITS,
        })
        .onConflictDoNothing({ target: [artJobs.userId, artJobs.requestKey] })
        .returning({ id: artJobs.id });
      inserted = result.length > 0;
      if (!inserted)
        await tx.delete(artAssets).where(eq(artAssets.id, assetId));
    });
  } catch (error) {
    await deleteArtAsset(key);
    throw error;
  }
  if (!inserted) {
    await deleteArtAsset(key);
    const [winner] = await db
      .select({ id: artJobs.id })
      .from(artJobs)
      .where(
        and(
          eq(artJobs.userId, user.id),
          eq(artJobs.requestKey, requestKey.data),
        ),
      )
      .limit(1);
    if (winner) return { ok: true, jobId: winner.id };
    throw new Error("Idempotent art job was not found");
  }
  try {
    await spendCredits({
      userId: user.id,
      amount: GENERATION_COST_CREDITS,
      ref: { type: "art_job", id: jobId },
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      await db
        .update(artJobs)
        .set({
          status: "failed",
          failureCode: "insufficient_credits",
          finishedAt: new Date(),
        })
        .where(eq(artJobs.id, jobId));
      await db
        .update(artAssets)
        .set({ expiresAt: new Date(Date.now() + 86_400_000) })
        .where(eq(artAssets.id, assetId));
      return {
        ok: false,
        error: "You need more credits to create this artwork.",
      };
    }
    // Keep awaiting_charge for human reconciliation if the commit acknowledgement was lost.
    throw error;
  }
  await db
    .update(artJobs)
    .set({ status: "queued" })
    .where(eq(artJobs.id, jobId));
  after(async () => {
    await processOneArtJob();
  });
  revalidatePath("/creations");
  return { ok: true, jobId };
}
