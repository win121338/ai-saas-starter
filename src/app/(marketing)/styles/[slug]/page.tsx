import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown } from "lucide-react";

import { ArtworkPair } from "@/components/marketing/artwork-pair";
import { CaseGallery } from "@/components/marketing/case-gallery";
import { TemplateCreateLink } from "@/components/marketing/template-create-link";
import { getCaseCatalog } from "@/lib/cases/catalog";
import { templateCover } from "@/lib/cases/types";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return (await getCaseCatalog()).templates.map((item) => ({ slug: item.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [locale, catalog, { slug }] = await Promise.all([
    getLocale(),
    getCaseCatalog(),
    params,
  ]);
  const template = catalog.templates.find((item) => item.id === slug);
  if (!template) return {};
  return {
    title: template.name[locale],
    description: template.summary[locale],
  };
}

export default async function StyleDetailPage({ params }: PageProps) {
  const [locale, catalog, { slug }] = await Promise.all([
    getLocale(),
    getCaseCatalog(),
    params,
  ]);
  const template = catalog.templates.find((item) => item.id === slug);
  if (!template) notFound();
  const cover = templateCover(template);

  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-9 md:px-6 md:pt-12">
        <Link
          href={localizedHref("/styles", locale)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t(locale, "Back to the case wall")}
        </Link>
        <div className="mb-10 mt-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="case-eyebrow">
              {t(locale, "THE COLLECTION")} /{" "}
              {String(catalog.templates.indexOf(template) + 1).padStart(2, "0")}
            </p>
            <h1 className="mt-4 font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-[-0.045em]">
              {template.name[locale]}
            </h1>
            <p className="mt-4 max-w-[640px] text-base leading-8 text-muted-foreground">
              {template.summary[locale]}
            </p>
          </div>
          <Link
            href="#collection-work"
            className="artora-quiet-action shrink-0 text-sm"
          >
            {template.cases.length} {t(locale, "artworks")}{" "}
            <ArrowDown className="size-4" aria-hidden />
          </Link>
        </div>
        <ArtworkPair artwork={cover} locale={locale} preload />
        <section
          id="collection-work"
          className="mt-14 scroll-mt-24 border-t border-border pt-9"
        >
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold">
              {t(locale, "More moments, same character.")}
            </h2>
            <TemplateCreateLink
              slug={template.generationStyleSlug}
              locale={locale}
            />
          </div>
          <CaseGallery items={template.cases} locale={locale} />
        </section>
      </div>
    </div>
  );
}
