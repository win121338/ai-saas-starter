import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StyleCard } from "@/components/marketing/style-card";
import { artStyles } from "@/config/art-styles";

export const metadata: Metadata = {
  title: "Art styles",
  description:
    "Explore six directions for turning your photos into personal artwork.",
};

export default function StylesPage() {
  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-20 md:px-6 md:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          The style library
        </p>
        <h1 className="mt-4 max-w-[790px] font-heading text-[clamp(3rem,5vw,4.5rem)] font-extrabold tracking-[-0.045em]">
          Every photo has more than one story.
        </h1>
        <p className="mt-5 max-w-[650px] text-lg leading-8 text-muted-foreground">
          Explore the creative directions we are preparing. Final examples will
          come from carefully tuned, real studio results.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artStyles.map((style, index) => (
            <StyleCard key={style.slug} style={style} index={index} />
          ))}
        </div>
        <div className="artora-surface mt-12 flex flex-wrap items-center justify-between gap-6 p-7">
          <div>
            <h2 className="font-heading text-2xl font-bold">
              Already have a photo in mind?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Preview it locally in the studio while we prepare generation.
            </p>
          </div>
          <Link href="/generate" className="artora-action">
            Open studio <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
