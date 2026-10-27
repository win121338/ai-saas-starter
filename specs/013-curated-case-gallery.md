# 013 — Curated case gallery

## Problem

The homepage and style library still show six generic placeholder styles. The owner has supplied 25 cropped examples across three prompt collections, but visitors cannot see them. The public catalog must grow by content rather than new page implementations.

## Solution

Replace the homepage placeholders with a featured blue-paper before/after composition, three collection entries and selected artwork. `/styles` becomes the case wall, with collection filtering, search, pagination and accessible enlargement. `/styles/[slug]` shows each collection; `/styles/[slug]/[caseId]` provides a shareable artwork detail. Navigation, sitemap and Chinese/English copy use the new catalog. The former oil, watercolor and other placeholder styles are temporarily removed from public pages and studio choices. Historical recipes and existing jobs remain readable. New collections without a connected generation recipe show an explicit preparation state.

Read the owner-selected catalog and manifests on the server, validate content with Zod and send only public display fields to client components. Adding a future collection requires content and catalog changes, not another page implementation. Reference examples retain that identity. The owner's request authorizes displaying these selected examples on the local site; no deployment is included.

## Out of scope

Model calls, paid testing, prompt publication, database changes, billing changes and deployment.

## Data changes

No database changes. Add a file catalog selecting the three collections and featured examples. Extend case metadata with English display titles. Keep prompts and raw processing records server-side.

## Test plan

Validate real catalog files, selected references, asset existence and dimensions. Reject duplicate IDs, unsafe paths and missing images. Assert client projections exclude prompts/source records. Test filtering and pagination, localized homepage/detail links, retired style URLs and sitemap contents. Verify browser navigation, full-image rendering, enlargement/keyboard close, mobile layout and no horizontal overflow. Run repository typecheck, lint and tests; report database environment failures explicitly.
