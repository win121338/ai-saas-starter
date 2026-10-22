CREATE TYPE "public"."art_asset_kind" AS ENUM('input', 'output');--> statement-breakpoint
CREATE TYPE "public"."art_job_status" AS ENUM('awaiting_charge', 'queued', 'submitting', 'processing', 'completed', 'failed', 'refund_pending', 'needs_reconciliation');--> statement-breakpoint
CREATE TABLE "art_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "art_asset_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"media_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "art_assets_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "art_assets_size_positive" CHECK ("art_assets"."size_bytes" > 0),
	CONSTRAINT "art_assets_dimensions_positive" CHECK ("art_assets"."width" > 0 AND "art_assets"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "art_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"request_key" uuid NOT NULL,
	"input_asset_id" uuid NOT NULL,
	"output_asset_id" uuid,
	"style_slug" text NOT NULL,
	"style_version" integer NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"provider_request_id" text,
	"cost_credits" integer NOT NULL,
	"status" "art_job_status" DEFAULT 'awaiting_charge' NOT NULL,
	"failure_code" text,
	"lease_until" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "art_jobs_cost_positive" CHECK ("art_jobs"."cost_credits" > 0),
	CONSTRAINT "art_jobs_style_version_positive" CHECK ("art_jobs"."style_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "art_assets" ADD CONSTRAINT "art_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "art_jobs" ADD CONSTRAINT "art_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "art_jobs" ADD CONSTRAINT "art_jobs_input_asset_id_art_assets_id_fk" FOREIGN KEY ("input_asset_id") REFERENCES "public"."art_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "art_jobs" ADD CONSTRAINT "art_jobs_output_asset_id_art_assets_id_fk" FOREIGN KEY ("output_asset_id") REFERENCES "public"."art_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "art_assets_user_id_idx" ON "art_assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "art_assets_expires_at_idx" ON "art_assets" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "art_jobs_user_request_key_idx" ON "art_jobs" USING btree ("user_id","request_key");--> statement-breakpoint
CREATE UNIQUE INDEX "art_jobs_provider_request_idx" ON "art_jobs" USING btree ("provider","provider_request_id");--> statement-breakpoint
CREATE INDEX "art_jobs_user_created_at_idx" ON "art_jobs" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "art_jobs_status_lease_idx" ON "art_jobs" USING btree ("status","lease_until");--> statement-breakpoint
CREATE INDEX "art_jobs_input_asset_idx" ON "art_jobs" USING btree ("input_asset_id");--> statement-breakpoint
CREATE INDEX "art_jobs_output_asset_idx" ON "art_jobs" USING btree ("output_asset_id");