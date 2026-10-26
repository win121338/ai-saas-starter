import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { getArtStyle } from "@/config/art-styles";
import { getArtModel } from "@/config/image-model-catalog";
import { requireSession } from "@/lib/auth/session";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Creations"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function CreationsPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const jobs = await db
    .select()
    .from(artJobs)
    .where(and(eq(artJobs.userId, session.user.id), isNull(artJobs.deletedAt)))
    .orderBy(desc(artJobs.createdAt), desc(artJobs.id))
    .limit(50);
  const outputIds = jobs
    .map((job) => job.outputAssetId)
    .filter((id): id is string => Boolean(id));
  const outputs = outputIds.length
    ? await db
        .select()
        .from(artAssets)
        .where(
          and(
            eq(artAssets.userId, session.user.id),
            inArray(artAssets.id, outputIds),
          ),
        )
    : [];
  const assets = new Map(outputs.map((asset) => [asset.id, asset]));
  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t(locale, "Your private library")}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            {t(locale, "Creations")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(locale, "Your latest 50 jobs. Outputs are kept for 30 days.")}
          </p>
        </div>
        <Link
          href={localizedHref("/generate", locale)}
          className="artora-action"
        >
          {t(locale, "Create new artwork")}
        </Link>
      </div>
      {jobs.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const output = job.outputAssetId
              ? assets.get(job.outputAssetId)
              : undefined;
            return (
              <Link
                key={job.id}
                href={localizedHref(`/creations/${job.id}`, locale)}
                className="artora-surface overflow-hidden transition-colors hover:border-primary/50"
              >
                <div className="relative aspect-[4/3] bg-secondary/50">
                  {output &&
                  !output.deletedAt &&
                  output.expiresAt > new Date() ? (
                    <Image
                      src={`/api/art-assets/${output.id}`}
                      alt={`${t(locale, getArtStyle(job.styleSlug)?.name ?? "Artwork")} ${t(locale, "result")}`}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {t(locale, job.status.replaceAll("_", " "))}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">
                    {t(
                      locale,
                      getArtStyle(job.styleSlug)?.name ?? job.styleSlug,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.createdAt.toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}{" "}
                    · {t(locale, job.status.replaceAll("_", " "))}
                    {job.provider === "mock" ? ` · ${t(locale, "demo")}` : ""}
                  </p>
                  {job.provider !== "mock" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getArtModel(job.model)?.label ?? job.model}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="artora-surface p-10 text-center">
          <p className="font-heading text-xl font-bold">
            {t(locale, "No artwork yet")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(locale, "Start with one photo in the studio.")}
          </p>
          <Link
            href={localizedHref("/generate", locale)}
            className="artora-action mt-5"
          >
            {t(locale, "Open studio")}
          </Link>
        </div>
      )}
    </div>
  );
}
