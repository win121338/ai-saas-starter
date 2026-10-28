# 016 — Optional style references and the second case intake

## Problem

New case1–case3 contain refer.png and prompts assigning style to image 1 and identity to image 2. The studio currently sends only the user's photo. New folder names also overlap the first intake and must not overwrite existing templates.

## Solution

Archive and hash-check 17 screenshots, three prompts and three explicit references. Crop only screenshot UI; preserve artwork content. Prepare three stable template packages. A recipe with a reference sends style first and the complete user photo second; without one it keeps the existing single-photo request. Qwen and Wan use ordered image content objects; Seedream uses an ordered image array. Unsupported providers and unavailable references fail before charging. Operators can upload/remove references and publish immutable recipe versions. References use immutable content hashes or existing unique media uploads; private local reference previews require administrator access.

## Out of scope

No paid generation, claims of measured quality, dependency/schema/pricing changes, replacement of the existing three templates or automatic public publication.

## Data changes

No database schema change. Extend validated recipe JSON with photo-with-reference input mode and an optional reference descriptor. Historical single-photo versions remain valid and unchanged.

## Test plan

Verify every source hash, crop rectangle, lossless output and compressed thumbnail; visually inspect every export. Check both API paths for all five models, order, actual Base64 bytes, one text entry, missing/tampered references and unsupported models. Test versioned references through job execution, no-charge failures, public data filtering, administrator editing and mobile/desktop studio behavior. Run typecheck, lint, all unit tests and relevant mocked browser tests.
