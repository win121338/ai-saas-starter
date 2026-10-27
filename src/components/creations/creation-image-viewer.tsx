"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export type CreationViewerImage = {
  id: "original" | "result";
  src: string;
  width: number;
  height: number;
  title: string;
};

/** URLs keep using the existing authenticated asset endpoint. */
export function CreationImageViewer({
  images,
  initialId,
  locale,
}: {
  images: CreationViewerImage[];
  initialId: CreationViewerImage["id"];
  locale: Locale;
}) {
  const [selectedId, setSelectedId] = useState(initialId);
  const [zoomed, setZoomed] = useState(false);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const thumbnail = images.find((image) => image.id === initialId);
  const selected = images.find((image) => image.id === selectedId) ?? thumbnail;
  if (!thumbnail || !selected) return null;
  const index = images.indexOf(selected);
  function step(direction: number) {
    setSelectedId(
      images[(index + direction + images.length) % images.length].id,
    );
    setZoomed(false);
  }

  return (
    <Dialog
      onOpenChange={() => {
        setSelectedId(initialId);
        setZoomed(false);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${t(locale, "View full size")}: ${thumbnail.title}`}
          className="group absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
        >
          <Image
            src={thumbnail.src}
            alt={thumbnail.title}
            fill
            unoptimized
            className="object-contain"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-xs text-white">
            <Expand className="size-4" aria-hidden />
            {t(locale, "View full size")}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="h-[92dvh] max-h-[96dvh] w-[96vw] max-w-[1400px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-2xl border bg-background p-3 shadow-none sm:max-w-[1400px] sm:p-5"
        onKeyDown={(event) => {
          if (images.length < 2) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 pr-12">
          <div className="min-w-0">
            <DialogTitle className="font-heading text-lg font-bold">
              {selected.title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {t(
                locale,
                "View the full image. Use the arrows to switch images.",
              )}
            </DialogDescription>
          </div>
          <button
            type="button"
            aria-label={t(locale, zoomed ? "Fit to screen" : "Actual size")}
            aria-pressed={zoomed}
            onClick={() => setZoomed(!zoomed)}
            className="case-icon-button shrink-0"
          >
            {zoomed ? (
              <ZoomOut className="size-5" />
            ) : (
              <ZoomIn className="size-5" />
            )}
          </button>
        </div>
        <DialogClose asChild>
          <button
            type="button"
            aria-label={t(locale, "Close image")}
            className="case-icon-button absolute right-3 top-3 sm:right-5 sm:top-5"
          >
            <X className="size-5" aria-hidden />
          </button>
        </DialogClose>
        <div
          key={`${selected.id}:${zoomed}`}
          data-testid="creation-full-image"
          data-zoomed={zoomed}
          className="min-h-0 min-w-0 overflow-auto rounded-xl bg-black/30"
        >
          {errorSrc === selected.src ? (
            <p role="alert" className="p-6 text-sm text-muted-foreground">
              {t(
                locale,
                "This image is unavailable. Refresh the page and try again.",
              )}
            </p>
          ) : (
            <div
              className={
                zoomed
                  ? "min-h-full w-max min-w-full"
                  : "flex h-full w-full items-center justify-center"
              }
            >
              <Image
                src={selected.src}
                width={selected.width}
                height={selected.height}
                alt={selected.title}
                unoptimized
                loading="eager"
                onError={() => setErrorSrc(selected.src)}
                className={
                  zoomed
                    ? "block max-w-none"
                    : "block h-full w-full object-contain"
                }
                style={
                  zoomed
                    ? { width: selected.width, height: selected.height }
                    : undefined
                }
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label={t(locale, "Previous image")}
            disabled={images.length < 2}
            onClick={() => step(-1)}
            className="case-icon-button disabled:opacity-30"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <p
            aria-live="polite"
            className="text-center text-xs text-muted-foreground"
          >
            {index + 1} / {images.length} · {selected.width} × {selected.height}
          </p>
          <button
            type="button"
            aria-label={t(locale, "Next image")}
            disabled={images.length < 2}
            onClick={() => step(1)}
            className="case-icon-button disabled:opacity-30"
          >
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
