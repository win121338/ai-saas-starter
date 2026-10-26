# 005 — Selectable domestic image models

## Problem

The photo-to-art studio has a local demo and a fal adapter, but the owner cannot currently fund fal with an international card. They have Alibaba Cloud Model Studio and Volcengine Ark API keys and need usable image-to-image generation now.

## Solution

The studio offers Qwen Image 2.1 Turbo by default and Seedream 5.0 Flash as a second choice. Only configured models can be submitted. The server validates the selected model, applies its private style prompt, and saves the result to the existing private creation flow. Qwen runs as an asynchronous task; Seedream returns one image synchronously. Definite provider rejection refunds the existing one-credit charge. Unknown submission or task outcomes remain available for reconciliation without automatic resubmission.

## Out of scope

Final prompt tuning, example artwork, changing subscription/credit pricing, paid live-generation acceptance, and exposing fal or OpenAI in the selector.

## Data changes

None. The existing art job stores the selected provider and model. `spendCredits` and `refundCredits` keep the existing `spend_{jobId}` and `refund_{jobId}` idempotency keys.

## Test plan

- Reject arbitrary model IDs and models without credentials before spending credits.
- Verify Qwen and Seedream request shape, output handling, and allowed image hosts.
- Verify durable completion, definite-failure refund, and unknown-task reconciliation against the test database.
- Run typecheck, lint, and the full Vitest suite.
