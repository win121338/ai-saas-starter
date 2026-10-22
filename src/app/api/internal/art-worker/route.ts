import { createHash, timingSafeEqual } from "node:crypto";

import {
  cleanupArtAssets,
  processOneArtJob,
  reconcileArtJobs,
} from "@/lib/art/jobs";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!env.ART_WORKER_SECRET)
    return new Response("Not configured", { status: 503 });
  const actual = createHash("sha256")
    .update(request.headers.get("authorization") ?? "")
    .digest();
  const expected = createHash("sha256")
    .update(`Bearer ${env.ART_WORKER_SECRET}`)
    .digest();
  if (!timingSafeEqual(actual, expected))
    return new Response("Unauthorized", { status: 401 });
  const reconciled = await reconcileArtJobs();
  let processed = 0;
  for (let index = 0; index < 5; index++) {
    if (!(await processOneArtJob())) break;
    processed++;
  }
  const cleaned = await cleanupArtAssets();
  return Response.json(
    { processed, reconciled, cleaned },
    { headers: { "Cache-Control": "no-store" } },
  );
}
