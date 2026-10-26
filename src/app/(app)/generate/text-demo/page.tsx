import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { GENERATION_COST_CREDITS } from "@/config/plans";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { GenerateForm } from "@/components/generate/generate-form";
import { TryAgainButton } from "@/components/generate/try-again-button";
import { PageHeader } from "@/components/app/page-header";
import { SparkleSpinner } from "@/components/sparkle-spinner";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: t(await getLocale(), "Legacy text demo"),
    robots: { index: false },
  };
}

function formatTimestamp(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default async function GeneratePage() {
  const session = await requireSession();
  const locale = await getLocale();

  const history = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, session.user.id))
    .orderBy(desc(generations.createdAt), desc(generations.id))
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm leading-6">
        {t(
          locale,
          "This is the original starter's text-to-image demo. It spends existing starter credits. The new photo-to-art studio is a separate workflow.",
        )}{" "}
        <Link
          href={localizedHref("/generate", locale)}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {t(locale, "Go to studio")}
        </Link>
      </div>
      <PageHeader
        eyebrow={t(locale, "Legacy demo")}
        title={t(locale, "Text to image")}
        action={
          <span className="chip-mono">
            {session.user.creditBalance ?? 0} {t(locale, "credits")}
          </span>
        }
      />

      <GenerateForm
        balance={session.user.creditBalance ?? 0}
        cost={GENERATION_COST_CREDITS}
        mock={env.AI_MOCK}
      />

      <section>
        <p className="eyebrow mb-3">{t(locale, "generations")}</p>
        {history.length === 0 ? (
          <div className="flex max-w-md items-start gap-4 rounded-md border-2 border-l-[6px] border-l-pop-mint px-5 py-6 shadow-hard-sm">
            {/* The coin mascot (DESIGN.md v3.1 illustration set). */}
            <Image
              src="/illustrations/mascot-paint.png"
              alt={t(locale, "Gold coin mascot painting at a tiny easel")}
              width={96}
              height={96}
              className="illo size-24 shrink-0"
            />
            <div>
              <p className="eyebrow">{t(locale, "First entry pending")}</p>
              <p className="mt-2 text-sm">
                {t(
                  locale,
                  "Nothing generated yet — and your welcome credits are ready. Describe an image in the form above; the result lands here and the ledger records the spend.",
                )}
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {history.map((generation) => (
              <li
                key={generation.id}
                className={
                  "overflow-hidden rounded-md border-2 transition-[translate,box-shadow] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-hard-sm" +
                  (generation.status === "failed"
                    ? " border-l-[6px] border-l-debit"
                    : "")
                }
              >
                <div className="relative aspect-square bg-secondary">
                  {generation.status === "completed" && generation.imageUrl ? (
                    <Image
                      src={generation.imageUrl}
                      alt={generation.prompt}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : generation.status === "failed" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
                      <p className="font-mono text-[11px] tracking-wider text-debit-text uppercase">
                        {t(locale, "Failed — credit refunded")}
                      </p>
                      <TryAgainButton prompt={generation.prompt} />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <SparkleSpinner className="size-6" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 border-t px-2.5 py-2">
                  <p className="truncate text-sm" title={generation.prompt}>
                    {generation.prompt}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatTimestamp(generation.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
