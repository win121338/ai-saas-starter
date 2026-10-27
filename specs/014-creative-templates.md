# 014 — Case-driven creative templates

## Problem

The gallery and generator use separate catalogs. New case collections cannot create jobs, and operations still manages retired generic styles.

## Solution

Use a database-backed creative template catalog for marketing, studio and operations. A template has bilingual content, ordered cases, a single-photo recipe, structured user options and immutable published versions. Operators import a validated package into a draft, edit, preview with normal credit charging, publish, select an earlier version and manage independent display/creation availability. Existing styles remain readable for historical jobs but cannot accept new jobs.

## Out of scope

No pricing changes, dependency additions or automatic paid image tests. First release supports single-photo recipes; original multi-reference manuscripts remain intact. Collected examples retain their provenance.

## Data changes

Add creative_templates, creative_template_versions, creative_template_media and art_jobs.is_test through a new generated migration. Seed the three approved collections with adapted, explicitly untested single-photo recipes. Preserve existing migrations, prompt versions and jobs. Reuse spendCredits/refundCredits with existing art_job idempotency keys.

## Test plan

Validate import boundaries and parameter injection; draft versus publication, rollback and version immutability; unique featured template; creation disabled/retired/model mismatch rejection; real mock-provider job creation, ownership, idempotency and credit invariants; admin permissions; mobile and desktop studio and public gallery consistency. Run typecheck, lint and tests.
