# 003 — Artora photo-to-art workflow

## Problem

The P1 studio only previews a local photo. A signed-in user cannot submit an image, recover a job after refreshing, or download a private result. The legacy text demo does not accept an input image.

## Solution

Accept one JPEG, PNG, or WebP image up to 10 MB, normalize it server-side, and store it privately. A user selects a public style ID; the server selects a versioned private prompt. Submitting with the same request key creates one durable job and spends starter credits once. A worker submits the edit to one image provider, records its provider request ID, polls/reconciles the result, saves the output privately, and marks the job complete. A definite failure triggers one ledger refund; uncertainty remains visible for reconciliation. The owner can refresh, compare, download, and delete a result. Other users cannot read the input, result, or job.

## Out of scope

Final proprietary style prompts and marketing examples, production API credentials, live paid generation, final credit pricing, payments, public sharing, batch jobs, and multilingual UI. The provisional prompts are clearly marked and must be replaced before launch. The user will choose the final provider after comparing API options.

## Data changes

Add private image assets and durable art jobs with owner IDs, storage keys, style/prompt versions, status, provider request ID, request idempotency key, cost snapshot, and timestamps. Add new migrations only. Credits remain in the existing append-only ledger: `spendCredits` uses `spend_{jobId}` and `refundCredits` uses `refund_{jobId}`. The existing `generations` table remains for the legacy text demo.

## Test plan

- Reject wrong file type, spoofed bytes, oversize images, and excess pixels; normalize away metadata.
- Repeated submit key returns the same job and one spend; concurrent attempts cannot double-spend.
- A refresh finds queued, processing, completed, failed, or reconciliation state.
- Anonymous and foreign users cannot read or delete private assets/jobs.
- Worker success stores one result; definite failure refunds once; unknown provider state does not resubmit or refund blindly.
- Owner can compare/download/delete a result; cleanup honors retention and does not delete an active job's input.
