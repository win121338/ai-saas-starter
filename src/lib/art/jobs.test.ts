import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/db";
import { artAssets, artJobs, users } from "@/db/schema";
import { getBalance, grantCredits, spendCredits } from "@/lib/credits";
import { closeDb, ensureTestDatabase } from "@/test/db";
import { processOneArtJob } from "./jobs";
import { deleteArtAssetsForUser } from "./cleanup-user";
import { artPrompt } from "./prompts";
import { readArtAsset, writeArtAsset } from "./storage";

beforeAll(ensureTestDatabase, 60_000);
afterAll(closeDb);
afterEach(() => vi.unstubAllGlobals());

async function setupJob(
  withInput: boolean,
  provider: "mock" | "qwen" | "seedream" | "wanx" = "mock",
  styleVersion = 1,
  promptOverride: string | null = null,
) {
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
    styleVersion,
    promptOverride,
    provider,
    model:
      provider === "qwen"
        ? "qwen-image-2.1-turbo"
        : provider === "wanx"
          ? "wan2.7-image"
          : provider === "seedream"
            ? "doubao-seedream-5-0-flash-260915"
            : "local-demo",
    costCredits: 1,
    status: "queued",
  });
  await spendCredits({
    userId,
    amount: 1,
    ref: { type: "art_job", id: jobId },
  });
  return { userId, assetId, jobId, key, bytes };
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

  it("only claims the requested owner's job during a page-driven check", async () => {
    const other = await setupJob(true);
    const target = await setupJob(true);
    expect(await processOneArtJob(target.jobId)).toBe(true);
    const [untouched] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, other.jobId));
    const [completed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, target.jobId));
    expect(untouched.status).toBe("queued");
    expect(completed.status).toBe("completed");
    expect(await getBalance(other.userId)).toBe(1);
    expect(await getBalance(target.userId)).toBe(1);
    expect(await processOneArtJob(target.jobId)).toBe(false);
    await deleteArtAssetsForUser(other.userId);
    await deleteArtAssetsForUser(target.userId);
    await db.delete(users).where(eq(users.id, other.userId));
    await db.delete(users).where(eq(users.id, target.userId));
  });

  it("persists a Seedream result in the private output asset", async () => {
    const job = await setupJob(true, "seedream");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ b64_json: job.bytes.toString("base64") }],
          }),
          { status: 200 },
        ),
      ),
    );
    expect(await processOneArtJob()).toBe(true);
    const [done] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(done.status).toBe("completed");
    expect(done.provider).toBe("seedream");
    expect(done.outputAssetId).toBeTruthy();
    expect(await getBalance(job.userId)).toBe(1);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("refunds a rejected Seedream request exactly once", async () => {
    const job = await setupJob(true, "seedream");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad request", { status: 400 })),
    );
    expect(await processOneArtJob()).toBe(true);
    const [failed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(failed.status).toBe("failed");
    expect(await getBalance(job.userId)).toBe(2);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("explains unavailable provider access and refunds a rejected request", async () => {
    const job = await setupJob(true, "seedream");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 })),
    );
    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [failed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(failed.status).toBe("failed");
    expect(failed.failureCode).toBe("provider_unavailable");
    expect(await getBalance(job.userId)).toBe(2);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("holds an unknown Qwen task for reconciliation without resubmitting or refunding", async () => {
    const job = await setupJob(true, "qwen");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_id: "task-1" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_status: "UNKNOWN" } }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await processOneArtJob()).toBe(true);
    const [submitted] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(submitted.status).toBe("processing");
    expect(submitted.providerRequestId).toBe("task-1");
    expect(await processOneArtJob()).toBe(true);
    const [held] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(held.status).toBe("needs_reconciliation");
    expect(await getBalance(job.userId)).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("sends the stored prompt version for a newly created Qwen job", async () => {
    const job = await setupJob(true, "qwen", 2);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output: { task_id: "prompt-task" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.input.messages[0].content[1].text).toBe(
      artPrompt("watercolor", 2),
    );
    expect(body.input.messages[0].content[1].text).toContain(
      "translucent washes",
    );

    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("sends a stored custom prompt before the watercolor rule", async () => {
    const custom = "Keep the subject's smile and make the colors cooler.";
    const job = await setupJob(true, "qwen", 3, custom);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output: { task_id: "custom-task" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.input.messages[0].content[1].text).toBe(
      artPrompt("watercolor", 3, custom),
    );
    expect(body.input.messages[0].content[1].text).toContain(
      "STYLE RULE — WATERCOLOR",
    );

    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("marks a failed status check as retrying and clears the warning after recovery", async () => {
    const job = await setupJob(true, "wanx");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_id: "wanx-task-2" } }), {
          status: 200,
        }),
      )
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_status: "RUNNING" } }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    expect(await processOneArtJob(job.jobId)).toBe(true);
    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [waiting] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(waiting.status).toBe("processing");
    expect(waiting.failureCode).toBe("provider_check_failed");
    expect(waiting.providerRequestId).toBe("wanx-task-2");
    expect(await getBalance(job.userId)).toBe(1);
    await db
      .update(artJobs)
      .set({ leaseUntil: new Date(Date.now() - 1_000) })
      .where(eq(artJobs.id, job.jobId));
    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [recovered] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(recovered.status).toBe("processing");
    expect(recovered.failureCode).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });

  it("retries a rate-limited Wanx submission and completes without changing the charge", async () => {
    const job = await setupJob(true, "wanx");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ output: { task_id: "wanx-task-1" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              task_status: "SUCCEEDED",
              choices: [
                {
                  message: {
                    content: [
                      {
                        image:
                          "https://dashscope-5859.oss-cn-wulanchabu-acdr-1.aliyuncs.com/result.webp",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(job.bytes, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await processOneArtJob()).toBe(true);
    const [queued] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(queued.status).toBe("queued");
    expect(queued.failureCode).toBe("provider_rate_limited");
    expect(queued.leaseUntil?.getTime()).toBeGreaterThan(Date.now());
    expect(await getBalance(job.userId)).toBe(1);
    expect(await processOneArtJob()).toBe(false);

    await db
      .update(artJobs)
      .set({ leaseUntil: new Date(Date.now() - 1_000) })
      .where(eq(artJobs.id, job.jobId));
    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [submitted] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(submitted.status).toBe("processing");
    expect(submitted.providerRequestId).toBe("wanx-task-1");
    expect(submitted.failureCode).toBeNull();
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      "/services/aigc/image-generation/generation",
    );

    await db
      .update(artJobs)
      .set({ leaseUntil: new Date(Date.now() - 1_000) })
      .where(eq(artJobs.id, job.jobId));
    expect(await processOneArtJob(job.jobId)).toBe(true);
    const [completed] = await db
      .select()
      .from(artJobs)
      .where(eq(artJobs.id, job.jobId));
    expect(completed.status).toBe("completed");
    expect(completed.outputAssetId).toBeTruthy();
    expect(await getBalance(job.userId)).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await deleteArtAssetsForUser(job.userId);
    await db.delete(users).where(eq(users.id, job.userId));
  });
});
