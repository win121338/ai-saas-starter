import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { artAssets, artJobs } from "@/db/schema";
import { getArtStyle } from "@/config/art-styles";
import { requireSession } from "@/lib/auth/session";
import { deleteArtJobAction } from "./actions";
import { StatusRefresher } from "./status-refresher";

export const metadata: Metadata = {
  title: "Artwork",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function CreationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
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
      <Link href="/creations" className="text-sm text-primary hover:underline">
        ← All creations
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {job.provider === "mock" ? "Local demo" : "Artwork"}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            {getArtStyle(job.styleSlug)?.name ?? job.styleSlug}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: {job.status.replaceAll("_", " ")} ·{" "}
            {job.createdAt.toLocaleString("en-US")}
          </p>
        </div>
        {showOutput ? (
          <a
            href={`/api/art-assets/${output.id}?download=1`}
            className="artora-action"
          >
            Download WebP
          </a>
        ) : null}
      </div>
      {job.status === "needs_reconciliation" ? (
        <p className="artora-surface p-5 text-sm">
          The provider response is uncertain. Your job is preserved for
          reconciliation; no second charge will be made.
        </p>
      ) : null}
      {job.status === "failed" ? (
        <p className="artora-surface p-5 text-sm">
          This job failed.{" "}
          {["insufficient_credits", "charge_not_recorded"].includes(
            job.failureCode ?? "",
          )
            ? "No credits were spent."
            : "The credit was refunded."}
        </p>
      ) : null}
      {[
        "awaiting_charge",
        "queued",
        "submitting",
        "processing",
        "refund_pending",
      ].includes(job.status) ? (
        <StatusRefresher />
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="artora-surface overflow-hidden">
          <div className="border-b border-border px-5 py-4 text-sm font-semibold">
            Original photo
          </div>
          <div className="relative aspect-[4/3] bg-secondary/40">
            {showInput ? (
              <Image
                src={`/api/art-assets/${input.id}`}
                alt="Original photo"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Original expired
              </div>
            )}
          </div>
        </section>
        <section className="artora-surface overflow-hidden">
          <div className="border-b border-border px-5 py-4 text-sm font-semibold">
            {job.provider === "mock" ? "Demo result" : "Finished artwork"}
          </div>
          <div className="relative aspect-[4/3] bg-secondary/40">
            {showOutput ? (
              <Image
                src={`/api/art-assets/${output.id}`}
                alt="Finished artwork"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {job.status === "completed"
                  ? "Result expired"
                  : "Waiting for result"}
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
            Delete creation
          </button>
        </form>
      ) : null}
    </div>
  );
}
