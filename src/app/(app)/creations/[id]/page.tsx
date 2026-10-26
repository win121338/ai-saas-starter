import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CircleAlert, Sparkles, TriangleAlert } from "lucide-react";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { getArtStyle } from "@/config/art-styles";
import { getArtModel } from "@/config/image-model-catalog";
import { artJobFailureMessage } from "@/lib/art/job-feedback";
import { resolveJobPrompt } from "@/lib/art/templates";
import { requireSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { deleteArtJobAction } from "./actions";
import { StatusRefresher } from "./status-refresher";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Artwork"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function CreationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  const { id } = await params;
  const [job] = await db
    .select()
    .from(artJobs)
    .where(
      and(
        eq(artJobs.id, id),
        eq(artJobs.userId, session.user.id),
        isNull(artJobs.deletedAt),
      ),
    )
    .limit(1);
  if (!job) notFound();
  const [input] = await db
    .select()
    .from(artAssets)
    .where(
      and(
        eq(artAssets.id, job.inputAssetId),
        eq(artAssets.userId, session.user.id),
      ),
    )
    .limit(1);
  const [output] = job.outputAssetId
    ? await db
        .select()
        .from(artAssets)
        .where(
          and(
            eq(artAssets.id, job.outputAssetId),
            eq(artAssets.userId, session.user.id),
          ),
        )
        .limit(1)
    : [];
  const showInput = input && !input.deletedAt && input.expiresAt > new Date();
  const showOutput =
    output && !output.deletedAt && output.expiresAt > new Date();
  return (
    <div className="mx-auto max-w-[1100px] space-y-7">
      <Link
        href={localizedHref("/creations", locale)}
        className="text-sm text-primary hover:underline"
      >
        ← {t(locale, "All creations")}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t(locale, job.provider === "mock" ? "Local demo" : "Artwork")}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            {t(locale, getArtStyle(job.styleSlug)?.name ?? job.styleSlug)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(locale, "Status:")} {t(locale, job.status.replaceAll("_", " "))}{" "}
            ·{" "}
            {job.createdAt.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
          </p>
          {job.provider !== "mock" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {getArtModel(job.model)?.label ?? job.model}
            </p>
          ) : null}
        </div>
        {showOutput ? (
          <a
            href={`/api/art-assets/${output.id}?download=1`}
            className="artora-action"
          >
            {t(locale, "Download WebP")}
          </a>
        ) : null}
      </div>
      {job.status === "needs_reconciliation" ? (
        <div
          role="alert"
          className="artora-surface flex gap-3 border-amber-400/35 p-5 text-sm"
        >
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-amber-300"
            aria-hidden
          />
          <div>
            <p className="font-semibold">
              {t(locale, "Result needs checking")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t(
                locale,
                "The provider response is uncertain. Your job is preserved for reconciliation; no second charge will be made.",
              )}
            </p>
          </div>
        </div>
      ) : null}
      {job.status === "failed" ? (
        <div
          role="alert"
          className="artora-surface flex gap-3 border-red-400/35 p-5 text-sm"
        >
          <CircleAlert
            className="mt-0.5 size-5 shrink-0 text-red-300"
            aria-hidden
          />
          <div>
            <p className="font-semibold">
              {t(locale, "Artwork could not be completed")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t(locale, artJobFailureMessage(job.failureCode))}
            </p>
            <Link
              href={localizedHref(
                `/generate?style=${encodeURIComponent(job.styleSlug)}`,
                locale,
              )}
              className="mt-3 inline-flex font-semibold text-primary hover:underline"
            >
              {t(locale, "Try another edit")}
            </Link>
          </div>
        </div>
      ) : null}
      {[
        "awaiting_charge",
        "queued",
        "submitting",
        "processing",
        "refund_pending",
      ].includes(job.status) ? (
        <StatusRefresher
          jobId={job.id}
          status={job.status}
          failureCode={job.failureCode}
          createdAt={job.createdAt.toISOString()}
          updatedAt={job.updatedAt.toISOString()}
          driveLocalWorker={env.NODE_ENV === "development"}
          locale={locale}
        />
      ) : null}
      {job.provider !== "mock" ? (
        <details className="artora-surface p-5 text-sm">
          <summary className="cursor-pointer font-semibold text-foreground">
            {t(locale, "Prompt used")}
          </summary>
          <p className="mt-3 whitespace-pre-wrap break-words leading-6 text-muted-foreground">
            {await resolveJobPrompt(
              job.styleSlug,
              job.styleVersion,
              job.promptOverride,
            )}
          </p>
        </details>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="artora-surface overflow-hidden">
          <div className="border-b border-border px-5 py-4 text-sm font-semibold">
            {t(locale, "Original photo")}
          </div>
          <div className="relative aspect-[4/3] bg-secondary/40">
            {showInput ? (
              <Image
                src={`/api/art-assets/${input.id}`}
                alt={t(locale, "Original photo")}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t(locale, "Original expired")}
              </div>
            )}
          </div>
        </section>
        <section className="artora-surface overflow-hidden">
          <div className="border-b border-border px-5 py-4 text-sm font-semibold">
            <span className="inline-flex items-center gap-2">
              {showOutput && job.provider !== "mock" ? (
                <Sparkles className="size-4 text-primary" aria-hidden />
              ) : null}
              {t(
                locale,
                job.provider === "mock" ? "Demo result" : "Finished artwork",
              )}
            </span>
          </div>
          <div
            className={`relative aspect-[4/3] bg-secondary/40 ${showOutput && job.provider !== "mock" ? "artora-finished-frame" : ""}`}
          >
            {showOutput ? (
              <>
                <Image
                  src={`/api/art-assets/${output.id}`}
                  alt={t(locale, "Finished artwork")}
                  fill
                  unoptimized
                  className="object-contain"
                />
                {job.provider !== "mock" ? (
                  <div aria-hidden="true">
                    <span className="artora-finished-star">✦</span>
                    <span className="artora-finished-star">✧</span>
                    <span className="artora-finished-star">✦</span>
                    <span className="artora-finished-star">✧</span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {job.status === "completed"
                  ? t(locale, "Result expired")
                  : t(locale, "Waiting for result")}
              </div>
            )}
          </div>
        </section>
      </div>
      {["completed", "failed"].includes(job.status) ? (
        <form action={deleteArtJobAction}>
          <input type="hidden" name="id" value={job.id} />
          <button
            type="submit"
            className="artora-quiet-action px-4 py-2 text-sm"
          >
            {t(locale, "Delete creation")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
