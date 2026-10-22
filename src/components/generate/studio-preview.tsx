"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ImagePlus,
  Info,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react";

import { artStyles } from "@/config/art-styles";
import { createArtJobAction } from "@/app/(app)/generate/art-actions";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 10 * 1024 * 1024;

export function StudioPreview({
  initialStyle,
  isDemo,
}: {
  initialStyle: string;
  isDemo: boolean;
}) {
  const [selected, setSelected] = React.useState(initialStyle);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, startTransition] = React.useTransition();
  const router = useRouter();
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
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (candidate.size > maxSize) {
      setFile(null);
      setPreview(null);
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    setError(null);
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  function removeFile() {
    requestKey.current = null;
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  const activeStyle =
    artStyles.find((style) => style.slug === selected) ?? artStyles[0];

  function submit() {
    if (!file || submitting) return;
    const form = new FormData();
    requestKey.current ??= crypto.randomUUID();
    form.set("requestKey", requestKey.current);
    form.set("style", selected);
    form.set("photo", file);
    startTransition(async () => {
      const result = await createArtJobAction({ ok: false }, form);
      if (result.ok && result.jobId) router.push(`/creations/${result.jobId}`);
      else {
        requestKey.current = null;
        setError(result.error ?? "Could not create your artwork.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section
          className="artora-surface p-5 sm:p-6"
          aria-labelledby="upload-title"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Step 01
              </p>
              <h2
                id="upload-title"
                className="mt-2 font-heading text-xl font-bold"
              >
                Upload a photo
              </h2>
            </div>
            <ImagePlus
              className="size-6 text-primary"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
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
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl bg-background">
                <Image
                  src={preview}
                  alt="Selected photo preview"
                  fill
                  unoptimized
                  className="object-contain"
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
              {file ? file.name : "Drop your photo here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG or WebP · up to 10 MB
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <label
                htmlFor="studio-photo"
                className="artora-quiet-action min-h-9 cursor-pointer px-4 text-xs"
              >
                {file ? "Replace photo" : "Choose photo"}
              </label>
              {file ? (
                <button
                  type="button"
                  onClick={removeFile}
                  className="artora-quiet-action min-h-9 px-3 text-xs"
                >
                  <X className="size-3.5" aria-hidden /> Remove
                </button>
              ) : null}
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-debit-text">
              {error}
            </p>
          ) : null}
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Your photo
            is uploaded to private storage when you create artwork.
            {isDemo
              ? ""
              : " The processed image is sent to fal for generation."}{" "}
            Inputs are kept for 24 hours after the job finishes.
          </p>
        </section>

        <section
          className="artora-surface p-5 sm:p-6"
          aria-labelledby="style-title"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Step 02
          </p>
          <h2 id="style-title" className="mt-2 font-heading text-xl font-bold">
            Choose a style
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {artStyles.map((style) => (
              <button
                key={style.slug}
                type="button"
                aria-pressed={selected === style.slug}
                onClick={() => {
                  setSelected(style.slug);
                }}
                className={`min-h-[76px] rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected === style.slug ? "border-primary bg-primary/10" : "border-border bg-secondary/45 hover:border-[#667084]"}`}
              >
                <span className="block text-sm font-semibold">
                  {style.name}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {style.category}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="artora-surface p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Step 03
          </p>
          <h2 className="mt-2 font-heading text-xl font-bold">
            Create artwork
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose a photo and style.{" "}
            {isDemo
              ? "This setup currently uses a local demo result until an image API is connected."
              : "Your artwork will be generated by the connected image provider."}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!file || submitting}
            className="artora-action mt-5 w-full"
          >
            {submitting ? "Uploading…" : "Create for 1 credit"}{" "}
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {isDemo
              ? "Demo mode uses 1 starter credit"
              : "This edit uses 1 credit"}
            ; a definite failure is refunded. Final pricing will be set after
            model testing.
          </p>
        </section>
      </div>

      <div className="artora-surface flex min-h-[650px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Studio canvas
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold">
              Your creative space
            </h2>
          </div>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {isDemo ? "Demo mode" : "Connected API"}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-8">
          {preview ? (
            <div className="w-full max-w-[600px]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-[#0b0d12]">
                <Image
                  src={preview}
                  alt="Your selected photo"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Selected direction
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold">
                    {activeStyle.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-4" aria-hidden /> Start over
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
                A blank canvas, for now.
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Add a photo on the left and choose a style. Your preview will
                appear here.
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-border bg-secondary/40 px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-7">
          Your finished artwork is available in{" "}
          <Link
            href="/creations"
            className="font-semibold text-primary hover:underline"
          >
            Creations
          </Link>
          {isDemo ? (
            <>
              . The original text-to-image starter is available in the{" "}
              <Link
                href="/generate/text-demo"
                className="font-semibold text-primary hover:underline"
              >
                legacy demo
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
