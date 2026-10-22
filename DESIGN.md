# DESIGN.md — Artora visual system (P1)

Artora is a working name. The first release is an English-first, dark art workspace. The UI takes the restrained near-black surfaces and warm orange action color proposed in `docs/PROJECT-PLAN.zh-CN.md`. Marketing explains the product; the workspace makes upload and style selection obvious.

## Product boundaries

- P1 is a visual and interaction prototype. It must not imply that photo-to-art generation or live payment is connected.
- The original text-to-image demonstration can remain available separately during migration, clearly labeled as a legacy demo.
- Example artwork slots are placeholders until the product owner supplies samples from the real prompt presets. Do not create or reuse generic AI art as proof of product quality.
- Never claim generation speed, likeness preservation, commercial rights, privacy guarantees, customer counts, or pricing that have not been verified.

## Layout and typography

- Marketing content max-width: 1200px, 24px desktop gutters and 20px mobile gutters.
- A compact sticky header, generous hero space, six style entries, a three-step explanation, a pricing preview, and concise FAQ.
- Use Instrument Sans for copy and UI. Use Bricolage Grotesque for display headings. Martian Mono only for small labels or metadata. Existing fonts are already installed via `next/font`.
- H1: responsive 48–80px; H2: responsive 32–52px; body: 16–18px. Keep line lengths readable.
- App layout: 240px desktop sidebar, 64px top bar. On small screens, use a horizontal navigation area and stacked content.

## Color tokens

These are chosen Artora design values, not sampled colors from reference sites.

| Role             | Token                  | Value     |
| ---------------- | ---------------------- | --------- |
| Background       | `--background`         | `#0b0d12` |
| Raised surface   | `--card`               | `#141821` |
| Elevated surface | `--secondary`          | `#1c2230` |
| Border           | `--border`             | `#2c3342` |
| Main text        | `--foreground`         | `#f4f6fa` |
| Muted text       | `--muted-foreground`   | `#a8b1c2` |
| Primary action   | `--primary`            | `#ffaa54` |
| Primary hover    | `--primary-hover`      | `#ffbd7a` |
| Primary text     | `--primary-foreground` | `#17120d` |

Success, warning, and error colors have separate semantic tokens; orange is for primary actions and highlights. Text contrast must be checked against actual rendered surfaces. Focus indicators must stay visible without relying on color alone.

## Components

- Cards have 16–24px corners, 1px borders, minimal shadows, and no hard offset shadow.
- Primary buttons are warm orange with dark text. Secondary buttons have dark surfaces and a visible border. Disabled controls visibly explain what is unavailable when appropriate.
- Focus rings are 2px orange with at least 2px offset. Hover motion is subtle and disabled under reduced-motion settings.
- Use the installed shadcn and Lucide primitives when practical; do not add a new animation or icon dependency.
- Style cards have reserved image slots. For now, show abstract placeholders and a "Sample coming soon" caption. When real examples arrive, use the same component and swap the media source.

## Page behavior

- Visitors can move from a public style card to the `/generate` workspace with that style selected after signing in.
- The workbench may select and preview a local photo in P1, but must not upload it to a server or charge credits. The action copy explicitly says this is a preview.
- Pricing screens show "Plans are being finalized" until prices and credit rules are approved. Existing starter prices must not be presented as Artora offers.
- Keep empty, loading, error, and mobile states usable. Avoid fake progress bars and fabricated testimonials.

## Migration note

The old design system was written for a colorful starter-kit landing page. Its original layout and colors are intentionally superseded by this document. Existing functional money and account modules are preserved during P1; their visual migration happens where necessary, with billing behavior unchanged.
