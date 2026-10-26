# 008 — Refresh trial image models

## Problem

Wanx 2.1 produces unsatisfactory edits for the product owner. The studio needs three current alternatives for side-by-side photo-to-art testing. Merely listing model IDs would fail because Wan 2.7 uses a different request body and result shape from Wanx 2.1.

## Solution

Remove Wanx 2.1 from selectable models. Add `wan2.7-image-pro`, `wan2.7-image`, and `qwen-image-3.0-pro` using the existing Beijing DashScope key and asynchronous task flow. Keep Qwen 2.1 Turbo as the default and Seedream available for comparison. Submit one input image and request one output; preserve the site's own style prompt without provider rewriting. Show the chosen model on saved creations. Retain the old Wanx adapter only to finish already-created jobs, without allowing new 2.1 submissions from the studio.

## Out of scope

Changing credit prices, adding multi-image inputs or multiple outputs, and making a paid live API test call. Production price and regional deployment require separate decisions after visual comparison.

## Data changes

None. Existing job rows record provider and model; credit spending and refunds remain unchanged.

## Test plan

- Active model selection accepts the three new IDs and rejects Wanx 2.1.
- Qwen 3.0 Pro submits an asynchronous I2I request with one image and one output.
- Both Wan 2.7 variants submit the new messages format and parse a `choices[].message.content[].image` result.
- Historical Wanx 2.1 task submission/polling remains compatible.
- Run typecheck, lint, and the full test suite.
