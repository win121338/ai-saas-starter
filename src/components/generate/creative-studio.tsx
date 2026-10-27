"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, ArrowRight, LoaderCircle } from "lucide-react";
import { createArtJobAction } from "@/app/(app)/generate/art-actions";
import type { CreativeDefinition } from "@/lib/creative/schema";
import type { CaseImage, CaseText } from "@/lib/cases/types";
import { localizedHref, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { GENERATION_COST_CREDITS } from "@/config/plans";
import { getArtModel } from "@/config/image-model-catalog";
import {
  ART_ASPECT_RATIOS,
  ART_ASPECT_RATIO_LABELS,
  artAspectRatioSchema,
  type ArtAspectRatio,
} from "@/config/art-aspect-ratios";

export type StudioTemplate = {
  id: string;
  name: CaseText;
  summary: CaseText;
  suitability: CaseText;
  version: number;
  cover: CaseImage;
  samples: { image: CaseImage; title: CaseText }[];
  fields: CreativeDefinition["recipe"]["fields"];
  aspectRatio: CreativeDefinition["recipe"]["aspectRatio"];
  tested: boolean;
  defaultModel: string;
  models: { id: string; label: string }[];
};

export function CreativeStudio({
  templates,
  initialId,
  initialRatio,
  initialModel,
  locale,
  preview,
  isDemo,
}: {
  templates: StudioTemplate[];
  initialId: string;
  initialRatio?: ArtAspectRatio;
  initialModel?: string;
  locale: Locale;
  preview: boolean;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(
    templates.find((item) => item.id === initialId)?.id ??
      templates[0]?.id ??
      "",
  );
  const template = templates.find((item) => item.id === selected);
  const [aspectRatio, setAspectRatio] = useState<ArtAspectRatio>(
    initialRatio ?? template?.aspectRatio ?? "1:1",
  );
  const [photoSize, setPhotoSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const photoRatio = photoSize ? photoSize.width / photoSize.height : 1;
  const [file, setFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [chosenModel, setChosenModel] = useState(
    () =>
      initialModel ??
      template?.models.find((item) => item.id === template.defaultModel)?.id ??
      template?.models[0]?.id ??
      "",
  );
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const matching = templates.filter((item) =>
    `${item.name.zh} ${item.name.en}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const visibleTemplates = matching.slice(0, expanded ? matching.length : 6);
  const [pending, startTransition] = useTransition();
  const requestKey = useRef<string | null>(null);
  const selectedModel = template?.models.find(
    (item) => item.id === chosenModel,
  );
  const model = selectedModel?.id ?? "";
  const chosenLabel = getArtModel(chosenModel)?.label ?? chosenModel;

  function keepSelectionInUrl(style: string, modelId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("style", style);
    if (modelId) url.searchParams.set("model", modelId);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template || !file || !model || pending) return;
    setError("");
    requestKey.current ??= crypto.randomUUID();
    const form = new FormData();
    form.set("requestKey", requestKey.current);
    form.set("style", template.id);
    form.set("promptVersion", String(template.version));
    form.set("preview", String(preview));
    form.set("model", model);
    form.set("aspectRatio", aspectRatio);
    form.set("options", JSON.stringify(options));
    form.set("photo", file);
    startTransition(async () => {
      try {
        const result = await createArtJobAction({ ok: false }, form);
        if (result.ok && result.jobId)
          router.push(localizedHref(`/creations/${result.jobId}`, locale));
        else
          setError(
            t(
              locale,
              result.error ?? "Could not create the artwork. Try again.",
            ),
          );
      } catch {
        setError(t(locale, "Could not create the artwork. Try again."));
      }
    });
  }

  if (!template)
    return (
      <div className="artora-surface p-7">
        <p>{t(locale, "No creative templates are available yet.")}</p>
        <Link
          href={localizedHref("/styles", locale)}
          className="mt-5 inline-block text-primary"
        >
          {t(locale, "Explore the case wall")}
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      {preview ? (
        <p
          role="status"
          className="artora-surface border-primary/40 p-4 text-sm text-primary"
        >
          {t(
            locale,
            "Administrator test. Normal credits apply. This snapshot is not activated for users.",
          )}
        </p>
      ) : null}
      {isDemo ? (
        <p className="text-sm text-muted-foreground">
          {t(
            locale,
            "Local demo: the result is a labeled placeholder, not generated artwork.",
          )}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">
          {t(locale, "Choose a template")}
        </h2>
        <Link
          className="text-sm text-primary"
          href={localizedHref("/styles", locale)}
        >
          {t(locale, "View all examples")}
        </Link>
      </div>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="group"
        aria-label={t(locale, "Choose a template")}
      >
        {templates.length > 6 ? (
          <label className="sm:col-span-2 lg:col-span-3">
            <span className="sr-only">
              {t(locale, "Search creative templates")}
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(locale, "Search creative templates")}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
            />
          </label>
        ) : null}
        {visibleTemplates.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pending}
            aria-pressed={selected === item.id}
            onClick={() => {
              setSelected(item.id);
              setOptions({});
              keepSelectionInUrl(item.id, chosenModel);
              requestKey.current = null;
              setError("");
            }}
            className={`flex min-w-0 items-center gap-4 rounded-2xl border p-3 text-left ${selected === item.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}
          >
            <Image
              {...item.cover}
              alt=""
              className="size-16 shrink-0 rounded-xl object-contain"
              sizes="64px"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                {item.name[locale]}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {t(locale, "Default")}: {item.aspectRatio} · v{item.version}
              </span>
            </span>
          </button>
        ))}
      </div>
      {matching.length > 6 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary"
        >
          {t(locale, expanded ? "Show fewer templates" : "Show all templates")}
        </button>
      ) : null}
      <form
        onSubmit={submit}
        className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      >
        <section className="artora-surface min-w-0 p-5 sm:p-6">
          <h2 className="font-heading text-lg font-bold">
            {t(locale, "Your photo")}
          </h2>
          <label
            htmlFor="studio-photo"
            className="mt-5 flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 focus-within:outline-2 focus-within:outline-primary"
          >
            {photo ? (
              <span
                data-testid="studio-original-preview"
                className="relative block w-full overflow-hidden"
                style={{ aspectRatio: photoRatio, maxWidth: 480 * photoRatio }}
              >
                <Image
                  src={photo}
                  fill
                  unoptimized
                  alt={t(locale, "Your uploaded photo")}
                  className="object-contain"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setPhotoSize({
                      width: image.naturalWidth,
                      height: image.naturalHeight,
                    });
                  }}
                />
              </span>
            ) : (
              <span className="flex flex-col items-center gap-3 p-8 text-center">
                <Upload className="size-7 text-primary" />
                <span className="text-sm font-semibold">
                  {t(locale, "Upload a photo")}
                </span>
                <span className="text-xs text-muted-foreground">
                  JPEG / PNG / WebP · 10 MB
                </span>
              </span>
            )}
            <input
              id="studio-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={pending}
              className="sr-only"
              onChange={(event) => {
                const candidate = event.target.files?.[0];
                if (!candidate) return;
                if (
                  !new Set(["image/jpeg", "image/png", "image/webp"]).has(
                    candidate.type,
                  ) ||
                  candidate.size > 10 * 1024 * 1024
                ) {
                  setError(
                    t(locale, "Choose a JPEG, PNG, or WebP photo under 10 MB."),
                  );
                  event.target.value = "";
                  return;
                }
                setFile(candidate);
                setPhotoSize(null);
                setPhoto(URL.createObjectURL(candidate));
                setError("");
                requestKey.current = null;
              }}
            />
          </label>
          {file ? (
            <p className="mt-3 break-all text-xs text-muted-foreground">
              {file.name} · {t(locale, "Click the photo to replace it")}
            </p>
          ) : null}
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              "Your full photo is preserved without cropping. The output ratio only changes the generated artwork. Pixel dimensions depend on the model.",
            )}
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              "Your photo and the template instruction are sent to the selected image provider when you create.",
            )}
          </p>
        </section>
        <section className="artora-surface min-w-0 space-y-5 p-5 sm:p-6">
          <div>
            <p className="case-eyebrow">{t(locale, "Selected template")}</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              {template.name[locale]}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {template.suitability[locale]}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {template.samples.map((sample, index) => (
              <Image
                key={index}
                {...sample.image}
                alt={sample.title[locale]}
                sizes="(max-width: 640px) 25vw, 130px"
                className="aspect-square h-auto w-full rounded-xl object-contain"
              />
            ))}
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              template.tested
                ? "See the examples for composition ideas. Results vary with the photo and model."
                : "Recipe not yet tested. The collected examples illustrate the intended direction.",
            )}
          </p>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">
              {t(locale, "Output ratio")}
            </legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ART_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  disabled={pending}
                  aria-pressed={aspectRatio === ratio}
                  onClick={() => {
                    setAspectRatio(artAspectRatioSchema.parse(ratio));
                    requestKey.current = null;
                    setError("");
                  }}
                  className={`min-h-16 rounded-xl border px-2 py-2 text-center focus-visible:outline-2 focus-visible:outline-primary ${aspectRatio === ratio ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 hover:border-primary/50"}`}
                >
                  <span className="block text-sm font-semibold">
                    {ratio === "original" ? t(locale, "Original ratio") : ratio}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {t(locale, ART_ASPECT_RATIO_LABELS[ratio])}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {t(
                locale,
                "Available to every user. Your selected ratio overrides the template default and remains selected when changing templates.",
              )}
            </p>
          </fieldset>
          {template.fields.map((field) => (
            <label key={field.key} className="block text-sm font-semibold">
              {field.label[locale]}
              <input
                name={field.key}
                value={options[field.key] ?? ""}
                maxLength={field.maxLength}
                placeholder={field.placeholder[locale]}
                disabled={pending}
                onChange={(event) => {
                  setOptions({ ...options, [field.key]: event.target.value });
                  requestKey.current = null;
                }}
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
              />
            </label>
          ))}
          <div className="border-t border-border pt-4">
            <label className="block text-sm font-semibold">
              {t(locale, "Image model")}
              <select
                aria-label={t(locale, "Image model")}
                value={chosenModel}
                disabled={pending}
                onChange={(event) => {
                  setChosenModel(event.target.value);
                  keepSelectionInUrl(selected, event.target.value);
                  requestKey.current = null;
                }}
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-3 py-3"
              >
                {!selectedModel ? (
                  <option value={chosenModel} disabled>
                    {chosenModel
                      ? `${chosenLabel} — ${t(locale, "Unavailable for this template")}`
                      : t(locale, "Choose an image model")}
                  </option>
                ) : null}
                {template.models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!model ? (
            <p role="alert" className="text-sm text-debit-text">
              {t(
                locale,
                chosenModel
                  ? "Your selected model is unavailable for this template. Choose another model explicitly; it will not be replaced automatically."
                  : "No compatible image model is available for this template.",
              )}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-debit-text">
              {error}
            </p>
          ) : null}
          {selectedModel ? (
            <p
              aria-live="polite"
              data-testid="submission-model"
              className="text-sm text-muted-foreground"
            >
              {t(locale, "This task will use:")}{" "}
              <span className="font-semibold text-foreground">
                {selectedModel.label}
              </span>
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!file || !model || pending}
            className="artora-action w-full disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {pending
              ? t(locale, "Creating…")
              : `${t(locale, "Create artwork")} · ${GENERATION_COST_CREDITS} ${t(locale, "credit")}`}
          </button>
        </section>
      </form>
    </div>
  );
}
