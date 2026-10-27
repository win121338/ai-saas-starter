import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { ArtworkPair } from "@/components/marketing/artwork-pair";
import { TemplateCreateLink } from "@/components/marketing/template-create-link";
import { getCaseCatalog } from "@/lib/cases/catalog";
import { artworkHref } from "@/lib/cases/types";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

type PageProps = { params: Promise<{ slug: string; caseId: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [locale, catalog, { slug, caseId }] = await Promise.all([
    getLocale(),
    getCaseCatalog(),
    params,
  ]);
  const artwork = catalog.templates
    .find((item) => item.id === slug)
    ?.cases.find((item) => item.id === caseId);
  if (!artwork) return {};
  return {
    title: `${artwork.title[locale]} · ${artwork.templateName[locale]}`,
    description: artwork.alt[locale],
  };
}

export default async function CaseDetailPage({ params }: PageProps) {
  const [locale, catalog, { slug, caseId }] = await Promise.all([
    getLocale(),
    getCaseCatalog(),
    params,
  ]);
  const template = catalog.templates.find((item) => item.id === slug);
  const artwork = template?.cases.find((item) => item.id === caseId);
  if (!template || !artwork) notFound();
  const index = template.cases.indexOf(artwork);
  const previous =
    template.cases[(index - 1 + template.cases.length) % template.cases.length];
  const next = template.cases[(index + 1) % template.cases.length];

  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-10 md:px-6">
        <Link
          href={localizedHref(`/styles/${template.id}`, locale)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {template.name[locale]}
        </Link>
        <div className="mb-9 mt-8">
          <p className="case-eyebrow">
            {t(locale, "THE MOMENT")} / {artwork.id}
          </p>
          <h1 className="mt-3 font-heading text-[clamp(2.1rem,4vw,3.5rem)] font-extrabold tracking-[-0.04em]">
            {artwork.title[locale]}
          </h1>
        </div>
        <ArtworkPair artwork={artwork} locale={locale} preload />
        <div className="mt-6">
          <TemplateCreateLink
            slug={template.generationStyleSlug}
            locale={locale}
          />
        </div>
        <nav
          aria-label={t(locale, "Artwork navigation")}
          className="mt-9 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-6"
        >
          <Link
            href={localizedHref(artworkHref(previous), locale)}
            className="artora-quiet-action text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t(locale, "Previous artwork")}
          </Link>
          <Link
            href={localizedHref("/styles", locale)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            {t(locale, "Back to the case wall")}{" "}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={localizedHref(artworkHref(next), locale)}
            className="artora-quiet-action text-sm"
          >
            {t(locale, "Next artwork")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </div>
    </div>
  );
}
