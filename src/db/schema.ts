import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Schema changes go through /db-migration: edit this file, `pnpm
// db:generate`, review the SQL, `pnpm db:migrate`. Never edit applied
// migrations in drizzle/.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ── Better Auth core tables (users, sessions, accounts, verifications) ──────
// Field names follow Better Auth's core schema; columns are snake_case.
// users additionally carries the app's Stripe pointer and the cached credit
// balance (the cache is maintained ONLY by src/lib/credits/).

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // Set at signup once billing is wired (M3). Written outside Better Auth.
    stripeCustomerId: text("stripe_customer_id").unique(),
    // Cache of SUM(credit_transactions.amount) — see src/lib/credits/.
    creditBalance: integer("credit_balance").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    // Defense-in-depth under the conditional-UPDATE spend guard: even if a
    // future code path bypasses src/lib/credits/, the database refuses a
    // negative balance.
    check("users_credit_balance_nonnegative", sql`${t.creditBalance} >= 0`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

// ── Subscription state ───────────────────────────────────────────────────────
// One row per user, upserted ONLY by syncStripeDataToDb in
// src/lib/billing/sync.ts, which fetches fresh state from Stripe. Webhook
// payloads are triggers, never sources of truth.

export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  // A Stripe subscription status ("active", "past_due", ...) or "none" when
  // the customer has no subscription. Text, not an enum — Stripe's status
  // set evolves and stale enums would reject valid syncs.
  status: text("status").notNull().default("none"),
  priceId: text("price_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  paymentMethodBrand: text("payment_method_brand"),
  paymentMethodLast4: text("payment_method_last4"),
  ...timestamps,
});

// ── Credits ledger ───────────────────────────────────────────────────────────
// Append-only. Rows are never updated or deleted; corrections are new
// compensating rows. Only src/lib/credits/ touches this table.

export const creditTransactionsType = pgEnum("credit_transactions_type", [
  "subscription_grant",
  "topup",
  "spend",
  "refund",
  "expiry", // unused in the free version (credits don't expire) — kept for Pro compatibility
  "admin_adjust",
]);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Signed credits. Positive = grant, negative = spend. Never zero.
    amount: integer("amount").notNull(),
    type: creditTransactionsType("type").notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    // The idempotency guard: a replayed webhook or retried action inserts
    // with the same key, hits the unique index, and becomes a no-op.
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Composite: powers getHistory (newest-first per user); the user_id
    // prefix also satisfies the every-FK-gets-an-index rule.
    index("credit_transactions_user_id_created_at_idx").on(
      t.userId,
      t.createdAt.desc(),
    ),
    check("credit_transactions_amount_nonzero", sql`${t.amount} <> 0`),
  ],
);

// ── Generations ──────────────────────────────────────────────────────────────

export const generationsStatus = pgEnum("generations_status", [
  "pending",
  "completed",
  "failed",
]);

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    imageUrl: text("image_url"),
    model: text("model").notNull(),
    status: generationsStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Composite: powers the history grid (newest-first per user); the
    // user_id prefix also satisfies the every-FK-gets-an-index rule.
    index("generations_user_id_created_at_idx").on(
      t.userId,
      t.createdAt.desc(),
    ),
  ],
);

// ── Photo-to-art assets and durable jobs ────────────────────────────────────

export const artAssetKind = pgEnum("art_asset_kind", ["input", "output"]);

export const artAssets = pgTable(
  "art_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: artAssetKind("kind").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mediaType: text("media_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("art_assets_user_id_idx").on(t.userId),
    index("art_assets_expires_at_idx").on(t.expiresAt),
    check("art_assets_size_positive", sql`${t.sizeBytes} > 0`),
    check(
      "art_assets_dimensions_positive",
      sql`${t.width} > 0 AND ${t.height} > 0`,
    ),
  ],
);

export const artJobStatus = pgEnum("art_job_status", [
  "awaiting_charge",
  "queued",
  "submitting",
  "processing",
  "completed",
  "failed",
  "refund_pending",
  "needs_reconciliation",
]);

export const artJobs = pgTable(
  "art_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestKey: uuid("request_key").notNull(),
    inputAssetId: uuid("input_asset_id")
      .notNull()
      .references(() => artAssets.id),
    outputAssetId: uuid("output_asset_id").references(() => artAssets.id, {
      onDelete: "set null",
    }),
    styleSlug: text("style_slug").notNull(),
    styleVersion: integer("style_version").notNull(),
    promptOverride: text("prompt_override"),
    isTest: boolean("is_test").notNull().default(false),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    providerRequestId: text("provider_request_id"),
    costCredits: integer("cost_credits").notNull(),
    status: artJobStatus("status").notNull().default("awaiting_charge"),
    failureCode: text("failure_code"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("art_jobs_user_request_key_idx").on(t.userId, t.requestKey),
    uniqueIndex("art_jobs_provider_request_idx").on(
      t.provider,
      t.providerRequestId,
    ),
    index("art_jobs_user_created_at_idx").on(t.userId, t.createdAt.desc()),
    index("art_jobs_status_lease_idx").on(t.status, t.leaseUntil),
    index("art_jobs_input_asset_idx").on(t.inputAssetId),
    index("art_jobs_output_asset_idx").on(t.outputAssetId),
    check("art_jobs_cost_positive", sql`${t.costCredits} > 0`),
    check("art_jobs_style_version_positive", sql`${t.styleVersion} > 0`),
  ],
);

// ── Operations console ──────────────────────────────────────────────────────
// Admin roles are granted explicitly. ADMIN_BOOTSTRAP_USER_ID is an optional
// owner escape hatch; no email-based self-enrollment is allowed.
export const adminMembers = pgTable("admin_members", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("admin"),
  grantedBy: text("granted_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: text("actor_user_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("admin_audit_events_created_at_idx").on(t.createdAt.desc())],
);

export const artStyleSettings = pgTable("art_style_settings", {
  slug: text("slug").primaryKey(),
  displayName: text("display_name"),
  sampleImageUrl: text("sample_image_url"),
  enabled: boolean("enabled").notNull().default(true),
  activeVersion: integer("active_version"),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const artStyleTemplateVersions = pgTable(
  "art_style_template_versions",
  {
    slug: text("slug").notNull(),
    version: integer("version").notNull(),
    preset: text("preset").notNull(),
    rule: text("rule").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.slug, t.version] }),
    check("art_style_template_version_positive", sql`${t.version} > 0`),
  ],
);

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Published creative recipes are immutable; drafts and availability live apart.
export const creativeTemplates = pgTable(
  "creative_templates",
  {
    id: text("id").primaryKey(),
    draft: jsonb("draft").notNull(),
    activeVersion: integer("active_version"),
    displayEnabled: boolean("display_enabled").notNull().default(false),
    creationEnabled: boolean("creation_enabled").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedBy: text("updated_by").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("creative_templates_one_featured_idx")
      .on(t.featured)
      .where(sql`${t.featured} = true`),
  ],
);

export const creativeTemplateVersions = pgTable(
  "creative_template_versions",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => creativeTemplates.id),
    version: integer("version").notNull(),
    definition: jsonb("definition").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.templateId, t.version] }),
    check("creative_template_version_positive", sql`${t.version} > 0`),
  ],
);

export const creativeTemplateMedia = pgTable("creative_template_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull().unique(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
