import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { hasRecordedSpend, refundCredits } from "@/lib/credits";
import { normalizeArtImage } from "./image";
import { artPrompt } from "./prompts";
import {
  DefiniteArtFailure,
  makeMockArt,
  pollFal,
  submitFal,
} from "./provider";
import { deleteArtAsset, readArtAsset, writeArtAsset } from "./storage";

const lease = () => new Date(Date.now() + 2 * 60_000);
const days = (count: number) => new Date(Date.now() + count * 86_400_000);

async function claimJob() {
  const [job] = await db
    .update(artJobs)
    .set({ status: "submitting", leaseUntil: lease() })
    .where(
      and(
        eq(artJobs.status, "queued"),
        sql`${artJobs.id} = (SELECT id FROM art_jobs WHERE status = 'queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)`,
      ),
    )
    .returning();
  return job;
}

async function claimPoll() {
  const [job] = await db
    .update(artJobs)
    .set({ leaseUntil: lease() })
    .where(
      and(
        eq(artJobs.status, "processing"),
        or(isNull(artJobs.leaseUntil), lt(artJobs.leaseUntil, new Date())),
        sql`${artJobs.id} = (SELECT id FROM art_jobs WHERE status = 'processing' AND (lease_until IS NULL OR lease_until < NOW()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)`,
      ),
    )
    .returning();
  return job;
}

async function complete(job: typeof artJobs.$inferSelect, result: Buffer) {
  const image = await normalizeArtImage(result, 20 * 1024 * 1024);
  const id = randomUUID();
  const key = `art/${job.id}/output.webp`;
  await writeArtAsset(key, image.bytes, true);
  await db.transaction(async (tx) => {
    const [asset] = await tx
      .insert(artAssets)
      .values({
        id,
        userId: job.userId,
        kind: "output",
        storageKey: key,
        mediaType: image.mediaType,
        sizeBytes: image.bytes.length,
        width: image.width,
        height: image.height,
        expiresAt: days(30),
      })
      .onConflictDoNothing({ target: artAssets.storageKey })
      .returning();
    const outputId =
      asset?.id ??
      (
        await tx
          .select({ id: artAssets.id })
          .from(artAssets)
          .where(eq(artAssets.storageKey, key))
          .limit(1)
      )[0]?.id;
    if (!outputId) throw new Error("Output asset missing");
    await tx
      .update(artJobs)
      .set({
        status: "completed",
        outputAssetId: outputId,
        leaseUntil: null,
        finishedAt: new Date(),
      })
      .where(eq(artJobs.id, job.id));
    await tx
      .update(artAssets)
      .set({ expiresAt: days(1) })
      .where(eq(artAssets.id, job.inputAssetId));
  });
}

async function failAndRefund(job: typeof artJobs.$inferSelect, code: string) {
  await db
    .update(artJobs)
    .set({ status: "refund_pending", failureCode: code, leaseUntil: null })
    .where(eq(artJobs.id, job.id));
  await refundCredits({
    userId: job.userId,
    ref: { type: "art_job", id: job.id },
  });
  await db
    .update(artJobs)
    .set({ status: "failed", finishedAt: new Date() })
    .where(eq(artJobs.id, job.id));
  await db
    .update(artAssets)
    .set({ expiresAt: days(1) })
    .where(eq(artAssets.id, job.inputAssetId));
}

export async function processOneArtJob(): Promise<boolean> {
  const queued = await claimJob();
  if (queued) {
    if (queued.provider === "mock") {
      try {
        await complete(
          queued,
          await makeMockArt(
            await readArtAsset(
              (
                await db
                  .select({ key: artAssets.storageKey })
                  .from(artAssets)
                  .where(eq(artAssets.id, queued.inputAssetId))
                  .limit(1)
              )[0].key,
            ),
          ),
        );
      } catch {
        await failAndRefund(queued, "mock_processing_failed");
      }
      return true;
    }
    try {
      const [asset] = await db
        .select({ key: artAssets.storageKey })
        .from(artAssets)
        .where(eq(artAssets.id, queued.inputAssetId))
        .limit(1);
      const requestId = await submitFal(
        await readArtAsset(asset.key),
        artPrompt(queued.styleSlug),
      );
      await db
        .update(artJobs)
        .set({
          status: "processing",
          providerRequestId: requestId,
          leaseUntil: new Date(),
        })
        .where(eq(artJobs.id, queued.id));
    } catch (error) {
      if (error instanceof DefiniteArtFailure) {
        await failAndRefund(queued, "provider_rejected_input");
        return true;
      }
      // A lost submission acknowledgement may still have started a paid job.
      await db
        .update(artJobs)
        .set({
          status: "needs_reconciliation",
          failureCode: "submit_outcome_unknown",
          leaseUntil: null,
        })
        .where(eq(artJobs.id, queued.id));
    }
    return true;
  }
  const job = await claimPoll();
  if (!job) return false;
  if (!job.providerRequestId) {
    await db
      .update(artJobs)
      .set({
        status: "needs_reconciliation",
        failureCode: "missing_provider_request",
        leaseUntil: null,
      })
      .where(eq(artJobs.id, job.id));
    return true;
  }
  try {
    const result = await pollFal(job.providerRequestId);
    if (result.done) await complete(job, result.bytes);
    else
      await db
        .update(artJobs)
        .set({ leaseUntil: new Date(Date.now() + 20_000) })
        .where(eq(artJobs.id, job.id));
  } catch (error) {
    if (error instanceof DefiniteArtFailure)
      await failAndRefund(job, "provider_processing_failed");
    else
      await db
        .update(artJobs)
        .set({ leaseUntil: new Date(Date.now() + 60_000) })
        .where(eq(artJobs.id, job.id));
  }
  return true;
}

export async function reconcileArtJobs() {
  const uncharged = await db
    .select()
    .from(artJobs)
    .where(
      and(
        eq(artJobs.status, "awaiting_charge"),
        lt(artJobs.createdAt, new Date(Date.now() - 2 * 60_000)),
      ),
    )
    .limit(20);
  for (const job of uncharged) {
    if (await hasRecordedSpend(job.userId, job.id)) {
      await db
        .update(artJobs)
        .set({ status: "queued" })
        .where(
          and(eq(artJobs.id, job.id), eq(artJobs.status, "awaiting_charge")),
        );
    } else {
      await db
        .update(artJobs)
        .set({
          status: "failed",
          failureCode: "charge_not_recorded",
          finishedAt: new Date(),
        })
        .where(
          and(eq(artJobs.id, job.id), eq(artJobs.status, "awaiting_charge")),
        );
      await db
        .update(artAssets)
        .set({ expiresAt: days(1) })
        .where(eq(artAssets.id, job.inputAssetId));
    }
  }
  const stuck = await db
    .update(artJobs)
    .set({
      status: "needs_reconciliation",
      failureCode: "submission_ack_lost",
      leaseUntil: null,
    })
    .where(
      and(
        eq(artJobs.status, "submitting"),
        lt(artJobs.leaseUntil, new Date()),
        isNull(artJobs.providerRequestId),
      ),
    )
    .returning({ id: artJobs.id });
  const refunds = await db
    .select()
    .from(artJobs)
    .where(eq(artJobs.status, "refund_pending"))
    .limit(20);
  for (const job of refunds)
    await failAndRefund(job, job.failureCode ?? "processing_failed");
  return uncharged.length + stuck.length + refunds.length;
}

export async function cleanupArtAssets() {
  const expired = await db
    .select()
    .from(artAssets)
    .where(
      and(isNull(artAssets.deletedAt), lt(artAssets.expiresAt, new Date())),
    )
    .limit(20);
  let count = 0;
  for (const asset of expired) {
    const active = await db
      .select({ id: artJobs.id })
      .from(artJobs)
      .where(
        and(
          eq(artJobs.inputAssetId, asset.id),
          sql`${artJobs.status} IN ('awaiting_charge','queued','submitting','processing','refund_pending','needs_reconciliation')`,
        ),
      )
      .limit(1);
    if (active.length) continue;
    await deleteArtAsset(asset.storageKey);
    await db
      .update(artAssets)
      .set({ deletedAt: new Date() })
      .where(eq(artAssets.id, asset.id));
    count++;
  }
  return count;
}
