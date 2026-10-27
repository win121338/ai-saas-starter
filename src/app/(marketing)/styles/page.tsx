import type { Metadata } from "next";

import { CaseGallery } from "@/components/marketing/case-gallery";
import { CollectionCard } from "@/components/marketing/collection-card";
import { getCaseCatalog } from "@/lib/cases/catalog";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "The case wall"),
    description: t(
      locale,
      "Explore comic posters, color-block manga and playful marker doodles. Open each artwork to compare it with the original photo.",
    ),
  };
}

export const dynamic = "force-dynamic";

export default async function StylesPage() {
  const [locale, catalog] = await Promise.all([getLocale(), getCaseCatalog()]);
  const items = catalog.templates.flatMap((item) => item.cases);
  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-12 md:px-6 md:pt-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="case-eyebrow">{t(locale, "THE CASE WALL")}</p>
            <h1 className="mt-4 max-w-[800px] font-heading text-[clamp(2.8rem,6vw,4.75rem)] font-extrabold leading-[1.08] tracking-[-0.045em]">
              {t(locale, "A moment. Many possibilities.")}
            </h1>
            <p className="mt-5 max-w-[600px] text-base leading-8 text-muted-foreground">
              {t(
                locale,
                "Explore comic posters, color-block manga and playful marker doodles. Open each artwork to compare it with the original photo.",
              )}
            </p>
          </div>
          <p className="shrink-0 font-mono text-xs text-muted-foreground">
            {String(catalog.templates.length).padStart(2, "0")}{" "}
            {t(locale, "collections")} / {items.length} {t(locale, "artworks")}
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.templates.map((template, index) => (
            <CollectionCard
              key={template.id}
              template={template}
              locale={locale}
              index={index}
            />
          ))}
        </div>
        <section
          id="case-wall"
          className="mt-16 scroll-mt-24 border-t border-border pt-10"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {t(locale, "All the little moments.")}
            </h2>
            <p className="max-w-[520px] text-xs leading-6 text-muted-foreground">
              {t(
                locale,
                "Collected photo-to-art references. Studio results will be added after testing.",
              )}
            </p>
          </div>
          <CaseGallery
            items={items}
            filters={catalog.templates.map((item) => ({
              id: item.id,
              name: item.name,
              count: item.cases.length,
            }))}
            locale={locale}
            controls
          />
        </section>
      </div>
    </div>
  );
}
