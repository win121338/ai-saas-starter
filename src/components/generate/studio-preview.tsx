"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ImagePlus,
  Info,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";

import { ART_PROMPT_MAX_LENGTH } from "@/config/art-prompts";
import {
  ART_ASPECT_RATIOS,
  aspectRatioValue,
  type ArtAspectRatio,
} from "@/config/art-aspect-ratios";
import { DEFAULT_ART_MODEL } from "@/config/image-model-catalog";
import { createArtJobAction } from "@/app/(app)/generate/art-actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 10 * 1024 * 1024;

export function StudioPreview({
  initialStyle,
  isDemo,
  styles,
  promptPresets,
  styleRules,
  promptVersions,
  models,
}: {
  initialStyle: string;
  isDemo: boolean;
  styles: { slug: string; name: string; category: string }[];
  promptPresets: Record<string, string>;
  styleRules: Record<string, string>;
  promptVersions: Record<string, number>;
  models: {
    id: string;
    provider: string;
    label: string;
    description: string;
    available: boolean;
  }[];
}) {
  const [selected, setSelected] = React.useState(initialStyle);
  const [aspectRatio, setAspectRatio] =
    React.useState<ArtAspectRatio>("original");
  const [uploadOpen, setUploadOpen] = React.useState(true);
  const [styleOpen, setStyleOpen] = React.useState(true);
  const [ratioOpen, setRatioOpen] = React.useState(true);
  const [modelOpen, setModelOpen] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState(promptPresets[initialStyle] ?? "");
  const [promptError, setPromptError] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>(
    models.find((model) => model.id === DEFAULT_ART_MODEL && model.available)
      ?.id ??
      models.find((model) => model.available)?.id ??
      DEFAULT_ART_MODEL,
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, startTransition] = React.useTransition();
  const router = useRouter();
  const locale = useLocale();
  const requestKey = React.useRef<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function chooseFile(candidate?: File) {
    requestKey.current = null;
    if (!candidate) return;
    if (!acceptedTypes.has(candidate.type)) {
      setFile(null);
      setPreview(null);
      setError(t(locale, "Choose a JPEG, PNG, or WebP image."));
      return;
    }
    if (candidate.size > maxSize) {
      setFile(null);
      setPreview(null);
      setError(t(locale, "Choose an image smaller than 10 MB."));
      return;
    }
    setError(null);
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
    setUploadOpen(false);
  }

  function removeFile() {
    requestKey.current = null;
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadOpen(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  const activeStyle = styles.find((style) => style.slug === selected);
  const selectedPreset = promptPresets[selected] ?? "";
  const isCustomPrompt = prompt.trim() !== selectedPreset.trim();

  function submit() {
    if (!file || !activeStyle || submitting) return;
    const submittedPrompt = prompt.trim();
    if (
      submittedPrompt.length < 3 ||
      submittedPrompt.length > ART_PROMPT_MAX_LENGTH
    ) {
      setPromptOpen(true);
      setPromptError(
        t(locale, "Write a prompt between 3 and 2,000 characters."),
      );
      return;
    }
    setPromptError(null);
    const form = new FormData();
    requestKey.current ??= crypto.randomUUID();
    form.set("requestKey", requestKey.current);
    form.set("style", selected);
    form.set("promptVersion", String(promptVersions[selected]));
    form.set("model", selectedModel);
    form.set("aspectRatio", aspectRatio);
    form.set("prompt", submittedPrompt);
    form.set("photo", file);
    startTransition(async () => {
      const result = await createArtJobAction({ ok: false }, form);
      if (result.ok && result.jobId)
        router.push(localizedHref(`/creations/${result.jobId}`, locale));
      else {
        requestKey.current = null;
        setError(t(locale, result.error ?? "Could not create your artwork."));
      }
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <StudioSection
          title={t(locale, "Upload a photo")}
          eyebrow={t(locale, "Step 01")}
          summary={file?.name ?? t(locale, "Choose photo")}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        >
          <input
            ref={fileInput}
            id="studio-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
            className="mt-5 rounded-2xl border border-dashed border-[#4a5567] bg-secondary/45 p-6 text-center"
          >
            {preview ? (
              <div
                style={{ aspectRatio: aspectRatioValue(aspectRatio) ?? 4 / 3 }}
                className="relative mx-auto w-full max-w-xs overflow-hidden rounded-xl bg-background"
              >
                <Image
                  src={preview}
                  alt={t(locale, "Selected photo preview")}
                  fill
                  unoptimized
                  className={
                    aspectRatio === "original"
                      ? "object-contain"
                      : "object-cover"
                  }
                />
              </div>
            ) : (
              <UploadCloud
                className="mx-auto size-8 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            <p className="mt-4 text-sm font-semibold">
              {file ? file.name : t(locale, "Drop your photo here")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(locale, "JPEG, PNG or WebP · up to 10 MB")}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label
                htmlFor="studio-photo"
                className="artora-quiet-action min-h-9 cursor-pointer px-4 text-xs"
              >
                {t(locale, file ? "Replace photo" : "Choose photo")}
              </label>
              {file ? (
                <button
                  type="button"
                  onClick={removeFile}
                  className="artora-quiet-action min-h-9 px-3 text-xs"
                >
                  <X className="size-3.5" aria-hidden /> {t(locale, "Remove")}
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />{" "}
            {t(
              locale,
              "Your photo is uploaded to private storage when you create artwork.",
            )}
            {isDemo
              ? ""
              : t(
                  locale,
                  " The processed image and style instruction are sent to the selected model provider.",
                )}{" "}
            {t(locale, "Inputs are kept for 24 hours after the job finishes.")}
          </p>
        </StudioSection>
        {error ? (
          <p role="alert" className="text-sm text-debit-text">
            {error}
          </p>
        ) : null}

        <StudioSection
          title={t(locale, "Photo ratio")}
          eyebrow={t(locale, "Crop")}
          summary={
            aspectRatio === "original"
              ? t(locale, "Original ratio")
              : aspectRatio
          }
          open={ratioOpen}
          onOpenChange={setRatioOpen}
        >
          <div
            className="mt-4 grid grid-cols-3 gap-2"
            role="group"
            aria-label={t(locale, "Photo ratio")}
          >
            {ART_ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                aria-pressed={aspectRatio === ratio}
                onClick={() => {
                  setAspectRatio(ratio);
                  setRatioOpen(false);
                  requestKey.current = null;
                }}
                className={`min-h-10 rounded-xl border px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${aspectRatio === ratio ? "border-primary bg-primary/10" : "border-border bg-secondary/45 hover:border-primary/50"}`}
              >
                {ratio === "original" ? t(locale, "Original ratio") : ratio}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t(
              locale,
              "Ratios center-crop your photo before upload. The preview shows the crop.",
            )}
          </p>
        </StudioSection>

        <StudioSection
          title={t(locale, "Choose a style")}
          eyebrow={t(locale, "Step 02")}
          summary={activeStyle ? t(locale, activeStyle.name) : "—"}
          open={styleOpen}
          onOpenChange={setStyleOpen}
        >
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {styles.map((style) => (
              <button
                key={style.slug}
                type="button"
                aria-pressed={selected === style.slug}
                onClick={() => {
                  if (!isCustomPrompt)
                    setPrompt(promptPresets[style.slug] ?? "");
                  setSelected(style.slug);
                  setStyleOpen(false);
                  setPromptError(null);
                  requestKey.current = null;
                }}
                className={`min-h-[76px] rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === style.slug ? "border-primary bg-primary/10" : "border-border bg-secondary/45 hover:border-[#667084]"}`}
              >
                <span className="block text-sm font-semibold">
                  {t(locale, style.name)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t(locale, style.category)}
                </span>
              </button>
            ))}
          </div>
          {styles.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              {t(locale, "No art styles are currently available.")}
            </p>
          ) : null}
        </StudioSection>
        <StudioSection
          title={t(locale, "Generation prompt")}
          eyebrow={t(locale, "Advanced")}
          summary={t(locale, isCustomPrompt ? "Custom prompt" : "Style preset")}
          open={promptOpen}
          onOpenChange={setPromptOpen}
        >
          <div className="mt-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="studio-prompt">
                {t(locale, "Generation prompt")}
              </Label>
              <button
                type="button"
                onClick={() => {
                  setPrompt(selectedPreset);
                  setPromptError(null);
                  requestKey.current = null;
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t(locale, "Restore style preset")}
              </button>
            </div>
            <Textarea
              id="studio-prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setPromptError(null);
                requestKey.current = null;
              }}
              rows={4}
              maxLength={ART_PROMPT_MAX_LENGTH}
              aria-invalid={Boolean(promptError)}
              aria-describedby="studio-prompt-help"
              className="min-h-28 resize-y bg-secondary/45 leading-6"
            />
            <div
              id="studio-prompt-help"
              className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"
            >
              <span>
                {t(
                  locale,
                  isCustomPrompt
                    ? "Your edited prompt takes priority over the preset."
                    : "This is the selected style's default prompt.",
                )}
              </span>
              <span>
                {prompt.length}/{ART_PROMPT_MAX_LENGTH}
              </span>
            </div>
            {promptError ? (
              <p role="alert" className="text-xs text-debit-text">
                {promptError}
              </p>
            ) : null}
          </div>
          <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs font-semibold text-foreground">
              {t(locale, "Style rule (always applied)")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {styleRules[selected]}
            </p>
          </div>
          {isDemo ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(locale, "Demo mode does not apply the prompt to an AI model.")}
            </p>
          ) : null}
        </StudioSection>

        <StudioSection
          title={t(locale, "Choose a model")}
          eyebrow={t(locale, "Image model")}
          summary={
            models.find((model) => model.id === selectedModel)?.label ?? "—"
          }
          open={modelOpen}
          onOpenChange={setModelOpen}
        >
          <select
            id="studio-model"
            aria-label={t(locale, "Choose a model")}
            value={selectedModel}
            onChange={(event) => {
              setSelectedModel(event.target.value);
              setModelOpen(false);
              requestKey.current = null;
            }}
            className="mt-4 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            {models.map((model) => (
              <option
                key={model.id}
                value={model.id}
                disabled={!model.available}
              >
                {model.label}
                {model.available ? "" : ` — ${t(locale, "Not configured")}`}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t(
              locale,
              models.find((model) => model.id === selectedModel)?.description ??
                "",
            )}
          </p>
          {!models.find((model) => model.id === selectedModel)?.available && (
            <p role="status" className="mt-2 text-xs text-debit-text">
              {t(
                locale,
                "This model needs an API key before you can create artwork.",
              )}
            </p>
          )}
        </StudioSection>

        <section className="artora-surface p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {t(locale, "Step 03")}
          </p>
          <h2 className="mt-2 font-heading text-xl font-bold">
            {t(locale, "Create artwork")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t(locale, "Choose a photo and style.")}{" "}
            {isDemo
              ? t(
                  locale,
                  "This setup currently uses a local demo result until an image API is connected.",
                )
              : t(
                  locale,
                  "Your artwork will be generated by the connected image provider.",
                )}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={
              !file ||
              !activeStyle ||
              submitting ||
              !models.find((model) => model.id === selectedModel)?.available
            }
            className="artora-action mt-5 w-full"
          >
            {t(locale, submitting ? "Uploading…" : "Create for 1 credit")}{" "}
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t(
              locale,
              isDemo
                ? "Demo mode uses 1 starter credit"
                : "This edit uses 1 credit",
            )}
            {t(
              locale,
              "; a definite failure is refunded. Final pricing will be set after model testing.",
            )}
          </p>
        </section>
      </div>

      <div className="artora-surface flex min-h-[650px] flex-col overflow-hidden xl:sticky xl:top-24">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {t(locale, "Studio canvas")}
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold">
              {t(locale, "Your creative space")}
            </h2>
          </div>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {t(locale, isDemo ? "Demo mode" : "Connected API")}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8">
          {preview ? (
            <div className="w-full max-w-[600px]">
              <div
                style={{ aspectRatio: aspectRatioValue(aspectRatio) ?? 4 / 3 }}
                className="relative mx-auto overflow-hidden rounded-2xl border border-border bg-[#0b0d12]"
              >
                <Image
                  src={preview}
                  alt={t(locale, "Your selected photo")}
                  fill
                  unoptimized
                  className={
                    aspectRatio === "original"
                      ? "object-contain"
                      : "object-cover"
                  }
                />
              </div>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {t(locale, "Selected direction")}
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold">
                    {activeStyle ? t(locale, activeStyle.name) : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-4" aria-hidden />{" "}
                  {t(locale, "Start over")}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-[330px] text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <ImagePlus
                  className="size-8 text-primary"
                  strokeWidth={1.4}
                  aria-hidden
                />
              </div>
              <h3 className="mt-6 font-heading text-2xl font-bold">
                {t(locale, "A blank canvas, for now.")}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {t(
                  locale,
                  "Add a photo on the left and choose a style. Your preview will appear here.",
                )}
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-border bg-secondary/40 px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-7">
          {t(locale, "Your finished artwork is available in")}{" "}
          <Link
            href={localizedHref("/creations", locale)}
            className="font-semibold text-primary hover:underline"
          >
            {t(locale, "Creations")}
          </Link>
          {isDemo ? (
            <>
              {t(
                locale,
                ". The original text-to-image starter is available in the",
              )}{" "}
              <Link
                href={localizedHref("/generate/text-demo", locale)}
                className="font-semibold text-primary hover:underline"
              >
                {t(locale, "legacy demo")}
              </Link>
              .
            </>
          ) : (
            "."
          )}
        </div>
      </div>
    </div>
  );
}

function StudioSection({
  title,
  eyebrow,
  summary,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  eyebrow: string;
  summary: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      className={`artora-surface group ${open ? "p-5 sm:p-6" : "px-5 py-3 sm:px-6 sm:py-4"}`}
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-heading text-lg font-bold">{title}</h2>
          {!open ? (
            <p
              className="mt-1 truncate text-xs text-muted-foreground"
              title={summary}
            >
              {summary}
            </p>
          ) : null}
        </div>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      {children}
    </details>
  );
}
