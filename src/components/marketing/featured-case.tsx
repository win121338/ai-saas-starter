"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { templateCover, type CaseTemplate } from "@/lib/cases/types";
import { localizedHref, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function FeaturedCase({
  templates,
  featuredId,
  locale,
}: {
  templates: CaseTemplate[];
  featuredId: string;
  locale: Locale;
}) {
  const [selected, setSelected] = useState(featuredId);
  const template =
    templates.find((item) => item.id === selected) ?? templates[0];
  if (!template) return null;
  const cover = templateCover(template);

  return (
    <div className="min-w-0" data-testid="featured-case">
      <div className="relative pb-2 pl-10 pt-3 sm:pl-16">
        <Link
          href={localizedHref(`/styles/${template.id}`, locale)}
          className="case-hero-art block overflow-hidden rounded-[20px] border border-white/15 bg-card"
          aria-label={`${t(locale, "Explore collection")}: ${template.name[locale]}`}
        >
          <Image
            {...cover.after}
            alt={cover.alt[locale]}
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 65vw, 500px"
            preload={template.id === featuredId}
            className="aspect-square w-full object-contain"
          />
        </Link>
        {cover.before ? (
          <figure className="case-hero-original absolute left-0 top-9 w-[27%] max-w-[142px] rotate-[-7deg] rounded-xl border border-white/50 bg-[#e9e3d8] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] sm:top-12 sm:p-2">
            <Image
              {...cover.before}
              unoptimized
              alt={`${t(locale, "Original photo")}: ${cover.title[locale]}`}
              className="h-auto w-full rounded-md"
            />
            <figcaption className="py-2 text-center font-mono text-[9px] font-medium tracking-wider text-[#403b35] sm:text-[10px]">
              {t(locale, "THE ORIGINAL")}
            </figcaption>
          </figure>
        ) : null}
        <span className="absolute bottom-6 right-4 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white">
          {t(locale, "THE REIMAGINED")}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 pl-10 sm:pl-16">
        <div aria-live="polite">
          <p className="font-heading text-lg font-bold">
            {template.name[locale]}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(locale, "One photo. A whole new character.")}
          </p>
        </div>
        <Link
          href={localizedHref(`/styles/${template.id}`, locale)}
          className="case-icon-button shrink-0"
          aria-label={`${t(locale, "Explore collection")}: ${template.name[locale]}`}
        >
          <ArrowUpRight className="size-5" aria-hidden />
        </Link>
      </div>
      <div
        className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5"
        role="group"
        aria-label={t(locale, "Featured collections")}
      >
        {templates.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
            className={`case-hero-choice rounded-xl border p-2.5 text-left text-xs transition-colors sm:p-3 ${selected === item.id ? "border-primary/50 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:bg-card"}`}
          >
            <span className="mb-2 block font-mono text-[10px] text-primary">
              0{index + 1}
            </span>
            <span className="block leading-5">{item.name[locale]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
