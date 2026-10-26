# 006 — Wanx image editing

## Problem

The owner wants to compare Wanx 2.1 with Qwen and Seedream using the existing Alibaba Cloud Model Studio account. Wanx is a legacy Beijing-only image-editing model with a separate request format and a low two-task concurrency limit.

## Solution

The studio offers Wanx 2.1 Image Edit as a third model. It reuses the configured Beijing DashScope API key, submits an instruction edit with the uploaded photo and selected style prompt, polls the saved task, and stores the output in the existing private creation flow. A rate-limited submission returns to the queue for a later attempt rather than failing and refunding immediately. Unsupported models remain rejected before charging.

## Out of scope

Adding Wan 2.6/2.7, changing prices or credits, redesigning style presets, provider quota increases, and live paid smoke tests.

## Data changes

None. The existing `art_jobs.provider` and `model` text fields store `wanx` and `wanx2.1-imageedit`. Existing credit spend and refund functions retain their idempotency keys.

## Test plan

- Verify Wanx availability only with a configured DashScope key.
- Verify the Wanx request, task polling, result download host allowlist, and rejection of arbitrary model IDs.
- Verify a Wanx job completes through the durable worker and a 429 returns it to the queue without double spending or refunding.
- Run typecheck, lint, and the full Vitest suite.
