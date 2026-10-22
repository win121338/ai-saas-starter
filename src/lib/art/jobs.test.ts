import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db";
import { artAssets, artJobs, users } from "@/db/schema";
import { getBalance, grantCredits, spendCredits } from "@/lib/credits";
import { closeDb, ensureTestDatabase } from "@/test/db";
import { processOneArtJob } from "./jobs";
import { deleteArtAssetsForUser } from "./cleanup-user";
import { readArtAsset, writeArtAsset } from "./storage";

beforeAll(ensureTestDatabase, 60_000);
afterAll(closeDb);

async function setupJob(withInput: boolean) {
  const userId = `art_test_${randomUUID()}`;
  const assetId = randomUUID();
  const jobId = randomUUID();
  const key = `art/${assetId}/input.webp`;
  await db
    .insert(users)
    .values({ id: userId, name: "Art Test", email: `${userId}@test.local` });
  await grantCredits({
    userId,
    amount: 2,
    type: "topup",
    idempotencyKey: `art_test_grant_${jobId}`,
  });
  const bytes = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "#4488aa" },
  })
    .webp()
    .toBuffer();
  if (withInput) await writeArtAsset(key, bytes);
  await db.insert(artAssets).values({
    id: assetId,
    userId,
    kind: "input",
    storageKey: key,
    mediaType: "image/webp",
    sizeBytes: bytes.length,
    width: 64,
    height: 64,
    expiresAt: new Date(Date.now() + 86_400_000),
  });
  await db.insert(artJobs).values({
    id: jobId,
    userId,
    requestKey: randomUUID(),
    inputAssetId: assetId,
    styleSlug: "watercolor",
    styleVersion: 1,
    provider: "mock",
    model: "local-demo",
    costCredits: 1,
    status: "queued",
  });
  await spendCredits({
    userId,
    amount: 1,
    ref: { type: "art_job", id: jobId },
  });
  return { userId, assetId, jobId, key };
}

describe("durable art jobs", () => {
  it("completes a private mock job once and preserves the spend on retries", async () => {
    const job = await setupJob(true);
    expect(await processOneArtJob()).toBe(true);
    const [done] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(done.status).toBe("completed");
    expect(done.outputAssetId).toBeTruthy();
    const [output] = await db
      .select()
      .from(artAssets)
      .where(eq(artAssets.id, done.outputAssetId!));
    expect((await readArtAsset(output.storageKey)).length).toBeGreaterThan(0);
    expect(await getBalance(job.userId)).toBe(1);
    expect(await processOneArtJob()).toBe(false);
    expect(await getBalance(job.userId)).toBe(1);
    await deleteArtAssetsForUser(job.userId);
    await expect(readArtAsset(output.storageKey)).rejects.toThrow();
    await expect(readArtAsset(job.key)).rejects.toThrow();
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("refunds one credit when the local processor has a definite failure", async () => {
    const job = await setupJob(false);
    expect(await processOneArtJob()).toBe(true);
    const [failed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(failed.status).toBe("failed");
    expect(await getBalance(job.userId)).toBe(2);
    await db.delete(users).where(eq(users.id, job.userId));
  });
});
