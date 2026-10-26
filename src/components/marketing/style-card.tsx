import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Image as ImageIcon } from "lucide-react";

import type { ArtStyle } from "@/config/art-styles";
import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function StyleCard({
  style,
  index,
  locale,
}: {
  style: ArtStyle & { sampleImageUrl?: string | null };
  index: number;
  locale: Locale;
}) {
  return (
    <Link
      href={localizedHref(`/styles/${style.slug}`, locale)}
      className="artora-style-card group"
    >
      <div
        className="artora-style-art aspect-[4/3]"
        data-accent={style.accent}
        data-has-image={style.sampleImageUrl ? "true" : undefined}
      >
        {style.sampleImageUrl ? (
          <Image
            src={style.sampleImageUrl}
            alt={`${style.name} example`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-black/15 px-5 py-4 text-center backdrop-blur-sm">
            <ImageIcon
              className="size-6 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              {t(locale, "Curated example")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t(locale, "Coming soon")}
            </span>
          </div>
        )}
        <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[11px] text-white/75">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t(locale, style.category)}
          </p>
          <h3 className="mt-2 font-heading text-xl font-bold">
            {t(locale, style.name)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(locale, style.description)}
          </p>
        </div>
        <ArrowUpRight
          className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden
        />
      </div>
    </Link>
  );
}
