import Image from "next/image";

import type { CaseArtwork } from "@/lib/cases/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function ArtworkPair({
  artwork,
  locale,
  preload = false,
}: {
  artwork: CaseArtwork;
  locale: Locale;
  preload?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-7 md:grid-cols-[minmax(0,1fr)_minmax(160px,230px)] md:gap-8">
      <div className="min-w-0">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t(locale, "THE REIMAGINED")}
        </p>
        <Image
          {...artwork.after}
          alt={artwork.alt[locale]}
          sizes="(max-width: 768px) 90vw, 700px"
          preload={preload}
          className="max-h-[72dvh] w-full rounded-2xl border border-white/10 bg-card object-contain"
        />
      </div>
      <aside className="flex flex-col items-start gap-5">
        {artwork.before ? (
          <figure className="w-full max-w-[230px]">
            <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t(locale, "Original photo")}
            </figcaption>
            <Image
              {...artwork.before}
              unoptimized
              alt={`${t(locale, "Original photo")}: ${artwork.title[locale]}`}
              className="max-h-[260px] w-auto max-w-full rounded-xl border border-white/10 object-contain"
            />
          </figure>
        ) : null}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-primary">
            {t(
              locale,
              artwork.provenance === "studio-result"
                ? "Studio result"
                : "Reference collection",
            )}
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              artwork.provenance === "studio-result"
                ? "An artwork created with this studio template."
                : "Collected photo-to-art references. Studio results will be added after testing.",
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
