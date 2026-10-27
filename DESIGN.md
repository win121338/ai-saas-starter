# DESIGN.md — Artora visual system (P1)

Artora is a bilingual, dark art workspace. The UI takes the restrained near-black surfaces and warm orange action color proposed in `docs/PROJECT-PLAN.zh-CN.md`. Marketing presents case-driven creative templates; the workspace makes template selection and photo upload obvious.

## Product boundaries

- The studio uses published creative templates and the configured image provider. Mock results must be clearly labeled; live generation availability does not imply payment is connected.
- Retired generic styles are archived for historical jobs. They are not new creation choices. The separate text-to-image demonstration is not part of the primary flow.
- Collected case examples and actual studio results must retain their distinct provenance. Do not present collected examples or mock results as proof of generation quality.
- Never claim generation speed, likeness preservation, commercial rights, privacy guarantees, customer counts, or pricing that have not been verified.

## Layout and typography

- Marketing content max-width: 1200px, 24px desktop gutters and 20px mobile gutters.
- A compact sticky header, a primary featured template, selected collections, a searchable masonry case wall, a three-step explanation, a pricing preview, and concise FAQ.
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
- Template cards use reviewed case images and preserve artwork proportions. Templates share reusable list, detail and studio components.

## Page behavior

- Visitors can move from a public case to `/generate?style=<template-id>` with the template selected after signing in.
- Upload preview stays local until creation. Submitting a task uses the existing credit rules, privately stores the input and sends it with the server recipe to the configured provider. Show the actual credit amount before submission.
- Users edit only template-defined options. Operators manage private recipes and immutable published versions; an unavailable template does not disable other templates.
- Pricing screens show "Plans are being finalized" until prices and credit rules are approved. Existing starter prices must not be presented as Artora offers.
- Keep empty, loading, error, and mobile states usable. Avoid fake progress bars and fabricated testimonials.

## Migration note

The old design system was written for a colorful starter-kit landing page. Its original layout and colors are intentionally superseded by this document. Existing functional money and account modules are preserved during P1; their visual migration happens where necessary, with billing behavior unchanged.
