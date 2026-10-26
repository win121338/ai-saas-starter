import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StyleCard } from "@/components/marketing/style-card";
import { listConfiguredArtStyles } from "@/lib/art/templates";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "zh" ? "艺术风格" : "Art styles",
    description:
      locale === "zh"
        ? "探索艺术风格，把照片变成专属于你的艺术作品。"
        : "Explore directions for turning your photos into personal artwork.",
  };
}

export const dynamic = "force-dynamic";

export default async function StylesPage() {
  const locale = await getLocale();
  const artStyles = (await listConfiguredArtStyles()).filter(
    (style) => style.enabled,
  );
  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-20 md:px-6 md:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t(locale, "The style library")}
        </p>
        <h1 className="mt-4 max-w-[790px] font-heading text-[clamp(3rem,5vw,4.5rem)] font-extrabold tracking-[-0.045em]">
          {t(locale, "Every photo has more than one story.")}
        </h1>
        <p className="mt-5 max-w-[650px] text-lg leading-8 text-muted-foreground">
          {t(
            locale,
            "Explore the creative directions we are preparing. Final examples will come from carefully tuned, real studio results.",
          )}
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artStyles.map((style, index) => (
            <StyleCard
              key={style.slug}
              style={style}
              index={index}
              locale={locale}
            />
          ))}
        </div>
        <div className="artora-surface mt-12 flex flex-wrap items-center justify-between gap-6 p-7">
          <div>
            <h2 className="font-heading text-2xl font-bold">
              {t(locale, "Already have a photo in mind?")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(
                locale,
                "Bring it into the studio and compare available image models.",
              )}
            </p>
          </div>
          <Link
            href={localizedHref("/generate", locale)}
            className="artora-action"
          >
            {t(locale, "Open studio")}{" "}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
