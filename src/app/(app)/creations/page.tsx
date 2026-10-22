import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { getArtStyle } from "@/config/art-styles";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Creations",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function CreationsPage() {
  const session = await requireSession();
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
            Your private library
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            Creations
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your latest 50 jobs. Outputs are kept for 30 days.
          </p>
        </div>
        <Link href="/generate" className="artora-action">
          Create new artwork
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
                href={`/creations/${job.id}`}
                className="artora-surface overflow-hidden transition-colors hover:border-primary/50"
              >
                <div className="relative aspect-[4/3] bg-secondary/50">
                  {output &&
                  !output.deletedAt &&
                  output.expiresAt > new Date() ? (
                    <Image
                      src={`/api/art-assets/${output.id}`}
                      alt={`${getArtStyle(job.styleSlug)?.name ?? "Artwork"} result`}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {job.status.replaceAll("_", " ")}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">
                    {getArtStyle(job.styleSlug)?.name ?? job.styleSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.createdAt.toLocaleDateString("en-US")} ·{" "}
                    {job.status.replaceAll("_", " ")}
                    {job.provider === "mock" ? " · demo" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="artora-surface p-10 text-center">
          <p className="font-heading text-xl font-bold">No artwork yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with one photo in the studio.
          </p>
          <Link href="/generate" className="artora-action mt-5">
            Open studio
          </Link>
        </div>
      )}
    </div>
  );
}
