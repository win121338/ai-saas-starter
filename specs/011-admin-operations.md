# 011 — Operations console

## Problem

The owner cannot inspect members, payments, and image jobs in one place or tune style templates and operational switches without changing source code. Customer-facing pages must never grant administrative access just because a navigation link is hidden.

## Solution

Add an owner-only `/admin` console with members, Stripe checkout/subscription read views, image job status, style template publishing, and safe settings. Admin access uses an exact user ID allowlist in server env or an explicit administrator membership. Every page and server action checks authorization. Mutations write an audit event in the same database transaction. Publishing creates an immutable prompt/rule version; new jobs bind to that version, old jobs and retries remain stable. Style availability and model switches affect new submissions. An optional announcement appears in the workspace.

## Out of scope

Direct payment refunds, subscription edits, manual credit adjustments, bulk account deletion, arbitrary SQL, secret management, and final plan pricing. The orders view reflects Stripe Checkout when Stripe is configured; it does not create a second payment ledger.

## Data changes

New `admin_members`, `admin_audit_events`, `art_style_settings`, `art_style_template_versions`, and `system_settings` tables. Existing subscription state and credit ledger are untouched. A new migration is generated; old migrations stay unchanged.

## Test plan

- Signed-out/non-admin access is denied on every admin page and action; env owner and DB member are accepted.
- Template publishing validates input, increments the version, records an audit event, and affects new jobs only. A submitted job uses its saved version during retries.
- Disabled styles/models are rejected at the server boundary, even if a forged form submits them.
- Settings reject unknown keys and invalid values; audit records only safe values.
- Member/job/order views paginate or cap results and avoid exposing secrets, raw payment payloads, or private images.
- Run typecheck, lint, tests, and relevant UI checks.
