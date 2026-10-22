# Artora — photo-to-art website (working name)

Artora is being built from the MIT-licensed [ai-saas-starter](https://github.com/nikandr-surkov/ai-saas-starter) in the [win121338 fork](https://github.com/win121338/ai-saas-starter). This repository now includes the **P2 photo-to-art workflow** in local demo mode.

The public site has an English home page, a style catalog and detail pages, a pricing preview, and an account area. The studio accepts a photo, creates a durable private job, spends one starter credit, and offers a private result in Creations. **Local default is a visibly labeled mock image, not AI art.** The fal adapter is present but needs an API key and live validation. Artora checkout is not connected yet. Case image slots stay empty until the product owner supplies examples made with the final prompt presets.

The original starter text-to-image demonstration is available at `/generate/text-demo` after signing in. The new `/generate` studio spends one starter credit and refunds a definite failure. Final credit pricing is pending provider-cost testing.

## Current routes

| Route                                 | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `/`                                   | Marketing home                             |
| `/styles`, `/styles/[slug]`           | Style library and details                  |
| `/pricing`                            | Plan structure preview; no live prices     |
| `/generate`                           | Photo upload and art job submission        |
| `/creations`, `/creations/[id]`       | Private artwork list, status, download     |
| `/generate/text-demo`                 | Original text-to-image demo                |
| `/dashboard`, `/billing`, `/settings` | Account overview, billing status, settings |

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Better Auth, Drizzle, PostgreSQL, the original append-only credits ledger, and Vitest/Playwright. Use **pnpm** for package management.

## Local setup

1. `pnpm install`
2. Start PostgreSQL 17 with `docker compose up -d` or point `DATABASE_URL` at another local PostgreSQL instance.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `BETTER_AUTH_SECRET` of at least 32 characters. Keep `AI_MOCK=true` for the legacy demo in development.
4. Run `pnpm db:migrate`, then `pnpm dev`.

See [P2 API candidates and operations](docs/P2-IMAGE-API-AND-OPERATIONS.zh-CN.md) for private storage, fal configuration, and the authenticated worker schedule. Production needs a **private** Vercel Blob store, fal credentials, and a trusted scheduler calling `/api/internal/art-worker`.

This Windows checkout also has a local PostgreSQL 17 installation under the ignored
`.local-postgres/` folder. The database `ai_saas_starter` has been migrated, and the
ignored `.env` contains generated local credentials. After restarting Windows, run
`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\local-postgres.ps1 start`
before `pnpm dev`. Use the same command with `status` or `stop` to inspect or stop it.
The server listens only on `127.0.0.1:5432`. The script maps the checkout to `P:`
because PostgreSQL's Windows initializer cannot use this checkout's Chinese path.
If this folder is cloned elsewhere, follow the standard setup above instead.

Stripe configuration is optional in development. Artora's billing pages do not expose the sample Stripe checkout. Do not use the starter's sample prices or credit amounts as Artora's final offers.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (the ledger and billing suites require a running PostgreSQL server)
- `pnpm build` (production env validation requires its configured variables)
- `pnpm test:e2e` (requires PostgreSQL and a Playwright browser)

## Project documents

- [Chinese project plan](docs/PROJECT-PLAN.zh-CN.md)
- [P1 feature specification](specs/002-artora-p1.md)
- [Design system](DESIGN.md)
- [Agent operating rules](AGENTS.md)

The working brand, canonical URL, legal pages, prompt presets, image provider, private photo storage, and payment provider all need final review before a public launch. Existing credits and Stripe internals are inherited from the starter and will be addressed in later phases.
