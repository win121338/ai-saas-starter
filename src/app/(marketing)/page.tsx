import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, MoveUpRight } from "lucide-react";

import { CaseGallery } from "@/components/marketing/case-gallery";
import { CollectionCard } from "@/components/marketing/collection-card";
import { FeaturedCase } from "@/components/marketing/featured-case";
import { getCaseCatalog } from "@/lib/cases/catalog";
import { templateCover } from "@/lib/cases/types";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [locale, catalog] = await Promise.all([getLocale(), getCaseCatalog()]);
  const total = catalog.templates.reduce(
    (sum, item) => sum + item.cases.length,
    0,
  );
  const heroTemplates = [...catalog.templates]
    .sort(
      (a, b) =>
        Number(b.id === catalog.featuredTemplateId) -
        Number(a.id === catalog.featuredTemplateId),
    )
    .slice(0, 3);

  return (
    <div className="artora-shell overflow-hidden">
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-14 pt-12 md:px-6 md:pb-20 md:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <div className="relative">
          <p className="case-eyebrow">
            <span className="size-1.5 rounded-full bg-primary" />{" "}
            {t(locale, "EVERYDAY PHOTOS, UNEXPECTED ART")}
          </p>
          <h1 className="mt-7 max-w-[650px] font-heading text-[clamp(3.15rem,6vw,5rem)] font-extrabold leading-[1.06] tracking-[-0.055em]">
            {t(locale, "Your photo.")}
            <br />
            <span className="text-primary">
              {t(locale, "A little more you.")}
            </span>
          </h1>
          <p className="mt-6 max-w-[430px] text-base leading-8 text-muted-foreground md:text-lg">
            {t(
              locale,
              "A quiet sip. A silly hat. A moment with your dog. Find a new way to see the everyday.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={localizedHref(
                catalog.templates.find(
                  (item) => item.id === catalog.featuredTemplateId,
                )?.generationStyleSlug
                  ? `/generate?style=${catalog.featuredTemplateId}`
                  : "/styles",
                locale,
              )}
              className="artora-action"
            >
              {t(locale, "Create your version")}{" "}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={localizedHref("/styles", locale)}
              className="artora-quiet-action"
            >
              {t(locale, "Explore the case wall")}{" "}
              <ArrowDown className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 border-t border-border pt-5 text-xs text-muted-foreground sm:gap-8">
            <span>
              <strong className="mr-2 font-mono text-base font-medium text-foreground">
                {String(catalog.templates.length).padStart(2, "0")}
              </strong>
              {t(locale, "collections")}
            </span>
            <span>
              <strong className="mr-2 font-mono text-base font-medium text-foreground">
                {total}
              </strong>
              {t(locale, "different moments")}
            </span>
            <span className="hidden sm:block">
              {t(locale, "More to come.")}
            </span>
          </div>
        </div>
        <FeaturedCase
          templates={heroTemplates.map((item) => ({
            ...item,
            cases: [templateCover(item)],
          }))}
          featuredId={catalog.featuredTemplateId}
          locale={locale}
        />
      </section>

      <section
        id="collections"
        className="scroll-mt-24 border-y border-border bg-card/25 py-16 md:py-20"
      >
        <div className="mx-auto max-w-[1200px] px-5 md:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="case-eyebrow">{t(locale, "THE COLLECTIONS")}</p>
              <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.04em]">
                {t(locale, "Find your kind of different.")}
              </h2>
            </div>
            <p className="max-w-[300px] text-sm leading-7 text-muted-foreground">
              {t(
                locale,
                "Big type, bold ink, a little attitude. Each collection has a character of its own.",
              )}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.templates.slice(0, 6).map((template, index) => (
              <CollectionCard
                key={template.id}
                template={template}
                locale={locale}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="cases"
        className="mx-auto max-w-[1200px] scroll-mt-24 px-5 py-16 md:px-6 md:py-24"
      >
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="case-eyebrow">{t(locale, "A FEW FAVORITES")}</p>
            <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.04em]">
              {t(locale, "Ordinary moments. Extra personality.")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {t(locale, "Open any artwork to see the photo behind it.")}
            </p>
          </div>
          <Link
            href={localizedHref("/styles", locale)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            {t(locale, "See all cases")}{" "}
            <span className="font-mono text-xs opacity-70">({total})</span>
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <CaseGallery items={catalog.featured} locale={locale} />
        <div className="mt-7 flex flex-col items-center justify-between gap-5 border-t border-border pt-7 sm:flex-row">
          <p className="max-w-[550px] text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              "Collected photo-to-art references. Studio results will be added after testing.",
            )}
          </p>
          <Link
            href={localizedHref("/styles", locale)}
            className="artora-quiet-action shrink-0 text-sm"
          >
            {t(locale, "Enter the case wall")}{" "}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-border bg-card/30 py-14 md:py-20"
      >
        <div className="mx-auto grid max-w-[1200px] gap-9 px-5 md:grid-cols-[1fr_2fr] md:gap-16 md:px-6">
          <div>
            <p className="case-eyebrow">
              {t(locale, "FROM PHOTO TO POSSIBILITY")}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight">
              {t(locale, "Start with a little curiosity.")}
            </h2>
          </div>
          <div className="grid gap-7 sm:grid-cols-3">
            {[
              [
                "01",
                "Find a feeling",
                "Explore the collections and save a direction that feels like you.",
              ],
              [
                "02",
                "Look a little closer",
                "Compare the original photo with the artwork. Notice the lines, colors and little details.",
              ],
              [
                "03",
                "Make room for your moment",
                "Choose a template, upload your photo, and create your version.",
              ],
            ].map(([number, title, copy]) => (
              <div key={number}>
                <span className="font-mono text-xs text-primary">
                  {number}{" "}
                  <MoveUpRight className="ml-1 inline size-3" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  {t(locale, title)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t(locale, copy)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-5 py-16 text-center md:px-6 md:py-20">
        <p className="case-eyebrow justify-center">
          {t(locale, "YOUR NEXT FAVORITE STARTS HERE")}
        </p>
        <h2 className="mt-4 font-heading text-[clamp(2.3rem,5vw,4rem)] font-extrabold tracking-[-0.045em]">
          {t(locale, "Which one feels like you?")}
        </h2>
        <Link
          href={localizedHref("/styles", locale)}
          className="artora-action mt-7"
        >
          {t(locale, "Explore the case wall")}{" "}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
