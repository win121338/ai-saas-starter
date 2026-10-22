# 002 — Artora P1 site and studio preview

## Problem

The starter currently markets developer tooling and exposes text-to-image. The product owner needs an international art-photo site with a reviewable dark visual direction before connecting the proprietary image-to-image prompts, model, and payments.

## Solution

Replace the starter marketing shell with Artora working-brand pages: home, style catalog and details, and a pricing preview. Make the authenticated `/generate` page a local-only upload-and-style preview. Keep the existing text-to-image demonstration available at a clearly labeled legacy route so current behavior and money paths are not silently changed. Update auth and app navigation to the new brand. Provide obvious slots for owner-supplied case images.

## Out of scope

No server upload, provider call for image-to-image, new charges, live checkout, plan or credit changes, database migration, new dependencies, or claim that placeholder styles are actual results. No generated marketing artwork is part of this phase.

## Data changes

None. Existing generation records remain viewable in the legacy demo. Existing ledger and billing modules are untouched.

## Test plan

- Typecheck, lint, unit tests and build.
- Public home, styles, style detail and pricing pages render and link correctly.
- Studio selects a style from query parameters, previews a valid local image, rejects invalid type or oversize files, and never submits or spends credits.
- Existing text-to-image demo path retains generation and refund behavior.
- Check desktop and mobile browser layouts and keyboard focus.
