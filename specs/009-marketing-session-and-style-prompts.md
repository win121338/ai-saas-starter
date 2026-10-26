# 009 — Consistent account state and editable style prompts

## Problem

The public header and footer always offer Sign in, even when the same visitor is authenticated in the studio. Current image-editing prompts use one short sentence per style, which gives models too little direction and makes style selection unreliable. Prompt text is also hidden in a server helper rather than an obvious configuration file.

## Solution

Read the verified session in the marketing navigation and footer. Signed-in visitors see only the Open studio action in the header and mobile menu; signed-out visitors also see Sign in. The footer keeps a workspace link for signed-in visitors. Keep all image-generation prompt text and the current prompt version in `src/config/art-prompts.ts`. Each style receives a distinct medium, texture, and rendering instruction. New jobs use version 2; queued version-1 jobs retain the exact original prompt. The job processor composes the prompt using the version stored on the job.

## Out of scope

An in-browser prompt editor, provider-specific prompt overrides, guaranteed visual fidelity, and changes to credits or model selection.

## Data changes

None. The existing `style_version` field records the prompt version.

## Test plan

- Marketing navigation and footer show account-appropriate links for both session states.
- Every public style has a version-2 prompt with distinctive visual guidance.
- Version-1 prompts remain unchanged for existing jobs; invalid styles or versions fail clearly.
- Run typecheck, lint, and the full test suite.
