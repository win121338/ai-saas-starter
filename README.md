# Artora — photo-to-art website (working name)

Artora is being built from the MIT-licensed [ai-saas-starter](https://github.com/nikandr-surkov/ai-saas-starter) in the [win121338 fork](https://github.com/win121338/ai-saas-starter). This repository includes the **P2 photo-to-art workflow** with Qwen, Wanx, and Seedream image-to-image adapters.

The public site has an English home page, a style catalog and detail pages, a pricing preview, and an account area. The studio accepts a photo, offers a model selector, creates a durable private job, spends one starter credit, and offers a private result in Creations. `ART_PROVIDER=mock` is a visibly labeled local demo; `ART_PROVIDER=live` exposes configured Qwen, Wanx, and Seedream models. Qwen and Wanx use the same Beijing DashScope API key, but Wanx has its own image-editing endpoint and is listed as a legacy Beijing-only model. The fal adapter remains available for later integration. Artora checkout is not connected yet. Case image slots stay empty until the product owner supplies examples made with the final prompt presets.

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
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and a random `BETTER_AUTH_SECRET` of at least 32 characters. Set `BETTER_AUTH_URL` to the exact browser origin, including the port (for example, `http://localhost:3000`), so authentication requests pass origin checks. Keep `AI_MOCK=true` for the legacy demo in development.
4. Run `pnpm db:migrate`, then `pnpm dev`.

See [P2 API candidates and operations](docs/P2-IMAGE-API-AND-OPERATIONS.zh-CN.md) for model configuration, private storage, and the authenticated worker schedule. Production needs a **private** Vercel Blob store, a live image-provider key, and a trusted scheduler calling `/api/internal/art-worker`.

The owner-only operations console at `/admin` covers member, payment, and job views, style template publishing, model switches, and an audit log. See [admin setup and scope](docs/ADMIN-BACKOFFICE-PLAN.zh-CN.md). Set `ADMIN_BOOTSTRAP_USER_ID` to an existing `users.id` in each environment before accessing it.

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
