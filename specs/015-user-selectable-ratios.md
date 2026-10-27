# 015 — User-selectable output ratios

## Problem

Published case recipes currently fix output to 1:1. Every user needs common design proportions regardless of membership or template.

## Solution

Offer 1:1, 3:4, 4:3, 4:5, 5:4, 2:3, 3:2, 9:16, 16:9 and original. Always preview, store and send the complete source photo at its original aspect ratio, independently of the selected output ratio. Input normalization may apply orientation, remove metadata and reduce resolution, but must not crop the source. Retain selection across template changes, save it with the job, pass a supported canvas to the provider and normalize only the saved result to the requested proportion. Template settings become defaults. Create-again links retain the ratio. Previously cropped input assets cannot be reconstructed; users must upload the original again.

## Out of scope

No custom pixel dimensions, pricing changes, membership gating or automatic paid model tests.

## Data changes

None to the database schema. A versioned JSON envelope in the existing prompt_override column stores the options, selected ratio and canvas. Historical flat-option and legacy free-text records remain readable without changing their instructions.

## Test plan

Validate all presets and model size constraints; verify normal users create portrait/landscape/original jobs, invalid ratios do not charge, historical instructions remain identical, saved results match selection, and desktop/mobile source previews preserve the entire photo when switching output ratios. Verify input asset dimensions and top/bottom content remain intact, including in the detail viewer, while output dimensions match the selected ratio. Run typecheck, lint and all unit tests plus relevant browser flows.
