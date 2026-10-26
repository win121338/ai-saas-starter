# 010 — Per-creation editable image prompt

## Problem

The studio sends a fixed style prompt. A user cannot adjust the instruction for a particular photo, and an asynchronous worker cannot reliably honor an edit unless the submitted text is stored with the job.

## Solution

Show the selected style's current prompt in an editable studio textarea. Changing style updates the preset while the prompt is untouched; after the user edits it, preserve their text and show that it takes priority over the default preset. Provide a button to restore that style's preset. Each style also has a visible, fixed medium rule that is appended to every new job, including custom prompts, so a selected watercolor style still asks for watercolor output. On submission, validate and trim the editable text (3–2,000 characters). Store an override only when it differs from the selected preset. The worker sends the stored override or saved style/version preset followed by the saved version's style rule. Retries use the same stored instruction. Existing jobs continue to use their versioned presets without newly added rules.

## Out of scope

Account-wide saved prompt templates, prompt sharing, automatic rewriting/translation, and changes to pricing or credits.

## Data changes

Add nullable `prompt_override` text column to `art_jobs` in a new Drizzle migration. No existing migration is edited. Null means the versioned system preset. The column is private to the job owner and removed with the job/account under existing retention rules.

## Test plan

- Studio preloads the selected style preset, preserves a user edit, shows the selected style rule, and restores the preset on request.
- Server rejects missing/invalid/oversized prompt input before uploading or charging.
- Custom prompt is stored once under the idempotent request key and sent before the selected style's fixed rule to each provider; absent override uses the saved style/version preset.
- Existing jobs and credit/refund behavior remain unchanged.
- Run typecheck, lint, and the full test suite.
