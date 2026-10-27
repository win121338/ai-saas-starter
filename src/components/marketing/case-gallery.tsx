"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Search,
  X,
} from "lucide-react";

import { ArtworkPair } from "@/components/marketing/artwork-pair";
import { CaseMasonry } from "@/components/marketing/case-masonry";
import { TemplateCreateLink } from "@/components/marketing/template-create-link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { filterCaseArtworks } from "@/lib/cases/gallery";
import { caseGalleryQuerySchema } from "@/lib/cases/schema";
import {
  artworkHref,
  type CaseArtwork,
  type CaseText,
} from "@/lib/cases/types";
import { localizedHref, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

type CollectionFilter = { id: string; name: CaseText; count: number };

export function CaseGallery({
  items,
  locale,
  filters = [],
  controls = false,
}: {
  items: CaseArtwork[];
  locale: Locale;
  filters?: CollectionFilter[];
  controls?: boolean;
}) {
  const params = useSearchParams();
  const queryState = caseGalleryQuerySchema.parse({
    collection: params.get("collection"),
    q: params.get("q"),
    limit: params.get("limit"),
  });
  const activeFilter =
    controls && filters.some((item) => item.id === queryState.collection)
      ? queryState.collection
      : "all";
  const query = controls ? queryState.q : "";
  const limit = controls ? queryState.limit : items.length;
  const filtered = filterCaseArtworks(items, activeFilter, query, locale);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const selectedIndex = filtered.findIndex(
    (item) => `${item.templateId}/${item.id}` === selectedKey,
  );
  const selected = filtered[selectedIndex];

  function updateQuery(changes: Record<string, string | null>) {
    const updated = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) updated.set(key, value);
      else updated.delete(key);
    }
    const suffix = updated.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash}`,
    );
  }

  function step(direction: number) {
    if (filtered.length === 0) return;
    const item =
      filtered[(selectedIndex + direction + filtered.length) % filtered.length];
    setSelectedKey(`${item.templateId}/${item.id}`);
  }

  return (
    <div>
      {controls ? (
        <div className="mb-8 space-y-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t(locale, "Filter by collection")}
            >
              {[
                {
                  id: "all",
                  name: { en: "All work", zh: "全部作品" },
                  count: items.length,
                },
                ...filters,
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={activeFilter === filter.id}
                  onClick={() =>
                    updateQuery({
                      collection: filter.id === "all" ? null : filter.id,
                      limit: null,
                    })
                  }
                  className={`case-filter rounded-full border px-4 py-2.5 text-xs font-medium transition-colors ${activeFilter === filter.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                >
                  {filter.name[locale]}{" "}
                  <span className="ml-2 opacity-65">{filter.count}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-[260px]">
              <label className="sr-only" htmlFor="case-search">
                {t(locale, "Search cases")}
              </label>
              <Search
                className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="case-search"
                type="search"
                value={query}
                onChange={(event) =>
                  updateQuery({
                    q: event.target.value.slice(0, 200) || null,
                    limit: null,
                  })
                }
                placeholder={t(locale, "Search a style or a moment…")}
                className="h-11 rounded-full border bg-card pl-10 text-sm"
              />
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-muted-foreground"
          >
            {filtered.length} {t(locale, "artworks")} ·{" "}
            {t(locale, "Open an image to see the original.")}
          </p>
        </div>
      ) : null}

      <CaseMasonry>
        {filtered.slice(0, limit).map((artwork) => (
          <Link
            key={`${artwork.templateId}/${artwork.id}`}
            href={localizedHref(artworkHref(artwork), locale)}
            prefetch={false}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              trigger.current = event.currentTarget;
              setSelectedKey(`${artwork.templateId}/${artwork.id}`);
            }}
            className="case-artwork group block rounded-2xl"
            aria-label={`${t(locale, "Open artwork")}: ${artwork.title[locale]}`}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card">
              <Image
                {...artwork.thumbnail}
                alt={artwork.alt[locale]}
                sizes="(max-width: 768px) 45vw, 370px"
                className="h-auto w-full object-contain"
              />
              <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </div>
            <div className="flex items-start justify-between gap-2 px-1 pb-2 pt-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-6">
                  {artwork.title[locale]}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  {artwork.templateName[locale]}
                </p>
              </div>
              <span className="pt-1 font-mono text-[10px] text-muted-foreground/65">
                {artwork.id}
              </span>
            </div>
          </Link>
        ))}
      </CaseMasonry>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-xl font-bold">
            {t(locale, "No matching moments yet.")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(locale, "Try another word or explore all collections.")}
          </p>
          <button
            type="button"
            className="artora-quiet-action mt-6 text-sm"
            onClick={() =>
              updateQuery({ collection: null, q: null, limit: null })
            }
          >
            {t(locale, "Show all work")}
          </button>
        </div>
      ) : null}
      {controls && filtered.length > limit ? (
        <div className="mt-9 text-center">
          <button
            type="button"
            onClick={() =>
              updateQuery({ limit: String(Math.min(limit + 24, items.length)) })
            }
            className="artora-quiet-action text-sm"
          >
            {t(locale, "Load more artwork")}{" "}
            <ArrowDown className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedKey(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92dvh] overflow-y-auto rounded-[24px] border bg-background p-5 sm:max-w-[1050px] sm:p-8"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus({ preventScroll: true });
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              step(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              step(1);
            }
          }}
        >
          {selected ? (
            <>
              <div className="pr-10">
                <DialogTitle className="font-heading text-xl font-bold leading-tight sm:text-2xl">
                  {selected.title[locale]}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {selected.templateName[locale]}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label={t(locale, "Close artwork")}
                  className="case-icon-button absolute right-4 top-4"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </DialogClose>
              <ArtworkPair artwork={selected} locale={locale} />
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={t(locale, "Previous artwork")}
                    className="case-icon-button"
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                  <span
                    className="font-mono text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {selectedIndex + 1} / {filtered.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={t(locale, "Next artwork")}
                    className="case-icon-button"
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
                <TemplateCreateLink
                  slug={selected.generationStyleSlug}
                  locale={locale}
                />
                <Link
                  href={localizedHref(artworkHref(selected), locale)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {t(locale, "View case details")}{" "}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
