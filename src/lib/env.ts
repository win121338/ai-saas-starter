import { z } from "zod";

/**
 * Environment validation — the only place `process.env` is read.
 *
 * Server-only: importing this from a client component will leak nothing (the
 * parse throws on the server at build/boot), but don't do it. Client code
 * that needs a NEXT_PUBLIC_* var must reference
 * `process.env.NEXT_PUBLIC_...` literally so Next.js can inline it at build.
 *
 * Empty strings are treated as unset, so a copied .env.example with blank
 * values behaves the same as missing vars. Every variable is documented in
 * .env.example.
 */

const STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_ULTRA_MONTHLY",
  "STRIPE_PRICE_TOPUP_100",
] as const;

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: z
      .url("DATABASE_URL must be a valid URL")
      .refine((v) => /^postgres(ql)?:\/\//.test(v), {
        message: "DATABASE_URL must be a postgres:// or postgresql:// URL",
      }),

    // ── Better Auth ───────────────────────────────────────────────────────
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "min 32 chars — generate with `openssl rand -base64 32`"),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    // Exact existing Better Auth user ID for the initial console owner.
    ADMIN_BOOTSTRAP_USER_ID: z.string().min(1).optional(),

    // ── OAuth (optional — a missing pair hides that login button) ─────────
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // ── Email via Resend (optional — emails no-op without it) ─────────────
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("Artora <onboarding@resend.dev>"),

    // ── Stripe ────────────────────────────────────────────────────────────
    // Optional in development so a fresh clone boots without a Stripe
    // account (features.billing turns off). Required in production —
    // enforced in superRefine below.
    STRIPE_SECRET_KEY: z
      .string()
      .startsWith("sk_", "expected a Stripe secret key (sk_...)")
      .optional(),
    STRIPE_WEBHOOK_SECRET: z
      .string()
      .startsWith("whsec_", "expected a webhook signing secret (whsec_...)")
      .optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
      .string()
      .startsWith("pk_", "expected a Stripe publishable key (pk_...)")
      .optional(),
    STRIPE_PRICE_PRO_MONTHLY: priceId(),
    STRIPE_PRICE_ULTRA_MONTHLY: priceId(),
    STRIPE_PRICE_TOPUP_100: priceId(),

    // ── AI generation ─────────────────────────────────────────────────────
    AI_GATEWAY_API_KEY: z.string().optional(),
    AI_IMAGE_MODEL: z
      .string()
      .regex(/^[\w.-]+\/[\w.:-]+$/, 'expected "provider/model" format')
      .default("openai/gpt-image-1"),
    AI_MOCK: stringBool(),

    // ── Rate limiting via Upstash (optional — in-memory fallback) ─────────
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // ── Storage via Vercel Blob (optional — ./.generated fallback in dev) ─
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    ART_PROVIDER: z.enum(["mock", "live", "fal"]).default("mock"),
    FAL_KEY: z.string().optional(),
    DASHSCOPE_API_KEY: z.string().optional(),
    ARK_API_KEY: z.string().optional(),
    DASHSCOPE_WORKSPACE_ID: z
      .string()
      .regex(/^[a-zA-Z0-9-]+$/)
      .optional(),
    ART_WORKER_SECRET: z.string().min(32).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.ART_PROVIDER === "fal" && !env.FAL_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["FAL_KEY"],
        message: "required when ART_PROVIDER=fal",
      });
    }
    if (
      env.ART_PROVIDER === "live" &&
      !env.DASHSCOPE_API_KEY &&
      !env.ARK_API_KEY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["ART_PROVIDER"],
        message: "set DASHSCOPE_API_KEY or ARK_API_KEY when ART_PROVIDER=live",
      });
    }
    const pairs = [
      ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
      ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ] as const;
    for (const [a, b] of pairs) {
      if (Boolean(env[a]) !== Boolean(env[b])) {
        ctx.addIssue({
          code: "custom",
          path: [env[a] ? b : a],
          message: `set both ${a} and ${b}, or neither`,
        });
      }
    }
    if (env.NODE_ENV === "production") {
      for (const key of STRIPE_VARS) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "required in production (optional in development)",
          });
        }
      }
      if (env.AI_MOCK) {
        ctx.addIssue({
          code: "custom",
          path: ["AI_MOCK"],
          message:
            "must not be enabled in production — it returns placeholder images while still charging credits",
        });
      }
      if (!env.BLOB_READ_WRITE_TOKEN) {
        ctx.addIssue({
          code: "custom",
          path: ["BLOB_READ_WRITE_TOKEN"],
          message:
            "private Blob storage is required for production photo uploads",
        });
      }
      if (env.ART_PROVIDER === "mock") {
        ctx.addIssue({
          code: "custom",
          path: ["ART_PROVIDER"],
          message: "select a configured live image provider in production",
        });
      }
      if (!env.ART_WORKER_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["ART_WORKER_SECRET"],
          message: "required for production job polling",
        });
      }
    }
  });

function priceId() {
  return z
    .string()
    .startsWith(
      "price_",
      "expected a Stripe Price ID (price_...), not a Product ID (prod_...)",
    )
    .optional();
}

function stringBool() {
  return z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true");
}

export type Env = z.infer<typeof schema>;

/** Exported for tests. App code uses the `env` singleton below. */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  // Blank values in .env behave as unset.
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== ""),
  );
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join(".") || "(env)"}: ${issue.message}`,
    );
    throw new Error(
      [
        "Invalid environment variables:",
        ...lines,
        "Fix your .env — every variable is documented in .env.example.",
      ].join("\n"),
    );
  }
  return parsed.data;
}

export const env: Env = parseEnv(process.env);

/** Exported for tests. App code uses the `features` singleton below. */
export function deriveFeatures(e: Env) {
  return {
    /**
     * Checkout, customer portal, and the Stripe webhook are wired. Off (only
     * possible outside production): billing UI renders a setup card and
     * checkout/portal actions throw a clear "Stripe is not configured" error.
     */
    billing: STRIPE_VARS.every((key) => Boolean(e[key])),
    /** Show the "Continue with Google" button. */
    googleOAuth: Boolean(e.GOOGLE_CLIENT_ID),
    /** Show the "Continue with GitHub" button. */
    githubOAuth: Boolean(e.GITHUB_CLIENT_ID),
    /** Send real emails (magic links require this). */
    email: Boolean(e.RESEND_API_KEY),
    /** Distributed rate limiting; otherwise per-instance in-memory. */
    redisRateLimit: Boolean(e.UPSTASH_REDIS_REST_URL),
    /** Store generated images in Vercel Blob; otherwise ./.generated (dev). */
    blobStorage: Boolean(e.BLOB_READ_WRITE_TOKEN),
  } as const;
}

export const features = deriveFeatures(env);

/** Which Stripe vars are unset — drives the billing setup card in dev. */
export function missingBillingEnv(e: Env = env): string[] {
  return STRIPE_VARS.filter((key) => !e[key]);
}
