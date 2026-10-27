import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { CaseTemplate } from "@/lib/cases/types";
import { templateCover } from "@/lib/cases/types";
import { localizedHref, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function CollectionCard({
  template,
  locale,
  index = 0,
}: {
  template: CaseTemplate;
  locale: Locale;
  index?: number;
}) {
  const cover = templateCover(template);
  return (
    <Link
      href={localizedHref(`/styles/${template.id}`, locale)}
      className="case-collection group"
      data-collection={template.id}
    >
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-card">
        <Image
          {...cover.thumbnail}
          alt={cover.alt[locale]}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 370px"
          className="aspect-square w-full object-contain"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 font-mono text-[10px] text-white">
          {String(index + 1).padStart(2, "0")} / {template.cases.length}{" "}
          {t(locale, "artworks")}
        </span>
        <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
      <div className="pb-1 pt-5">
        <h3 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          {template.name[locale]}
        </h3>
        <p className="mt-2 max-w-[36ch] text-sm leading-6 text-muted-foreground">
          {template.summary[locale]}
        </p>
      </div>
    </Link>
  );
}
