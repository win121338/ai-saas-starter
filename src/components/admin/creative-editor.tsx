"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import {
  creativeDraftAction,
  creativeUploadAction,
} from "@/app/(app)/admin/templates/creative-actions";
import type { CreativeDefinition } from "@/lib/creative/schema";
import {
  artModels,
  supportsStyleReference,
} from "@/config/image-model-catalog";
import { ART_ASPECT_RATIOS } from "@/config/art-aspect-ratios";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

const input =
  "mt-2 w-full rounded-xl border border-border bg-secondary px-3 py-3 text-sm";
const section = "artora-surface space-y-5 p-5 sm:p-6";

function DraftButtons({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4">
      <button
        name="intent"
        value="save"
        disabled={pending}
        className="artora-quiet-action text-sm"
      >
        {t(locale, pending ? "Saving…" : "Save draft")}
      </button>
      <button
        name="intent"
        value="preview"
        disabled={pending}
        className="artora-quiet-action text-sm"
      >
        {t(locale, "Save and test")}
      </button>
      <button
        name="intent"
        value="publish"
        disabled={pending}
        className="artora-action text-sm"
      >
        {t(locale, "Publish new version")}
      </button>
    </div>
  );
}

export function CreativeEditor({
  initial,
  updatedAt,
  locale,
}: {
  initial: CreativeDefinition;
  updatedAt: string;
  locale: Locale;
}) {
  const [draft, setDraft] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [fieldsJson, setFieldsJson] = useState(
    JSON.stringify(initial.recipe.fields, null, 2),
  );
  const [error, setError] = useState("");
  const [uploading, startUpload] = useTransition();
  let fields = draft.recipe.fields;
  let fieldsValid = true;
  try {
    fields = JSON.parse(fieldsJson);
  } catch {
    fieldsValid = false;
  }
  const definition = {
    ...draft,
    tags: tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    recipe: { ...draft.recipe, fields },
  };
  const recipe = (patch: Partial<CreativeDefinition["recipe"]>) =>
    setDraft({ ...draft, recipe: { ...draft.recipe, ...patch } });
  const patchCase = (
    index: number,
    patch: Partial<CreativeDefinition["cases"][number]>,
  ) =>
    setDraft({
      ...draft,
      cases: draft.cases.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  function move(index: number, offset: number) {
    const items = [...draft.cases];
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setDraft({ ...draft, cases: items });
  }
  function upload(
    file: File,
    index?: number,
    before = false,
    reference = false,
  ) {
    setError("");
    const form = new FormData();
    form.set("image", file);
    form.set("usage", reference ? "reference" : "case");
    startUpload(async () => {
      try {
        const result = await creativeUploadAction(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setDraft((current) => {
          if (reference)
            return {
              ...current,
              recipe: {
                ...current.recipe,
                inputMode: "photo-with-reference",
                referenceImage: result.image,
              },
            };
          if (index !== undefined)
            return {
              ...current,
              cases: current.cases.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      ...(before
                        ? { before: result.image }
                        : { after: result.image, thumbnail: result.image }),
                    }
                  : item,
              ),
            };
          const id = crypto.randomUUID();
          return {
            ...current,
            cases: [
              ...current.cases,
              {
                id,
                title: { zh: "新案例", en: "New case" },
                alt: { zh: "新案例作品", en: "New example artwork" },
                before: null,
                after: result.image,
                thumbnail: result.image,
                tags: [],
                provenance: "collected-reference",
              },
            ],
          };
        });
      } catch {
        setError(t(locale, "Image upload failed. Try again."));
      }
    });
  }
  return (
    <form
      action={creativeDraftAction}
      className="space-y-6"
      onSubmit={(event) => {
        if (!fieldsValid || uploading) event.preventDefault();
      }}
    >
      <input
        type="hidden"
        name="definition"
        value={JSON.stringify(definition)}
      />
      <input type="hidden" name="updatedAt" value={updatedAt} />
      <section className={section}>
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Template details")}
        </h2>
        <p className="font-mono text-xs text-muted-foreground">{draft.id}</p>
        {(["name", "summary", "suitability"] as const).map((key) => (
          <div key={key} className="grid gap-4 sm:grid-cols-2">
            {(["zh", "en"] as const).map((language) => (
              <label key={language} className="text-sm font-semibold">
                {t(
                  locale,
                  key === "name"
                    ? "Display name"
                    : key === "summary"
                      ? "Summary"
                      : "Suitable photos",
                )}{" "}
                · {language}
                <textarea
                  required
                  maxLength={1200}
                  rows={key === "name" ? 1 : 3}
                  className={input}
                  value={draft[key][language]}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [key]: { ...draft[key], [language]: event.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
        ))}
        <label className="block text-sm font-semibold">
          {t(locale, "Tags (comma separated)")}
          <input
            className={input}
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
          />
        </label>
      </section>
      <section className={section}>
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Cases and cover")}
        </h2>
        <p className="text-xs leading-6 text-muted-foreground">
          {t(
            locale,
            "Upload public case material here. User photos belong in the private studio.",
          )}
        </p>
        {draft.cases.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start gap-4">
              <Image
                {...item.thumbnail}
                alt={item.alt[locale]}
                unoptimized
                className="size-24 rounded-lg object-contain"
              />
              <div className="min-w-0 flex-1 space-y-2">
                {(["zh", "en"] as const).map((language) => (
                  <input
                    key={language}
                    aria-label={`${t(locale, "Case title")} ${language} ${item.id}`}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                    value={item.title[language]}
                    onChange={(event) =>
                      patchCase(index, {
                        title: {
                          ...item.title,
                          [language]: event.target.value,
                        },
                        alt: { ...item.alt, [language]: event.target.value },
                      })
                    }
                  />
                ))}
                <select
                  aria-label={`${t(locale, "Case source")} ${item.id}`}
                  value={item.provenance}
                  onChange={(event) =>
                    patchCase(index, {
                      provenance:
                        event.target.value === "studio-result"
                          ? "studio-result"
                          : "collected-reference",
                    })
                  }
                  className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-xs"
                >
                  <option value="collected-reference">
                    {t(locale, "Collected reference")}
                  </option>
                  <option value="studio-result">
                    {t(locale, "Studio result")}
                  </option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <label>
                <input
                  type="radio"
                  name="cover"
                  checked={draft.coverCaseId === item.id}
                  onChange={() => setDraft({ ...draft, coverCaseId: item.id })}
                />{" "}
                {t(locale, "Cover")}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.featuredCaseIds.includes(item.id)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      featuredCaseIds: event.target.checked
                        ? [...draft.featuredCaseIds, item.id]
                        : draft.featuredCaseIds.filter((id) => id !== item.id),
                    })
                  }
                />{" "}
                {t(locale, "Featured artwork")}
              </label>
              <button
                type="button"
                disabled={index === 0 || uploading}
                onClick={() => move(index, -1)}
                className="rounded-lg border border-border px-3 py-2"
              >
                ↑ {t(locale, "Move up")}
              </button>
              <button
                type="button"
                disabled={index === draft.cases.length - 1 || uploading}
                onClick={() => move(index, 1)}
                className="rounded-lg border border-border px-3 py-2"
              >
                ↓ {t(locale, "Move down")}
              </button>
              <button
                type="button"
                disabled={
                  item.id === draft.coverCaseId ||
                  draft.cases.length < 2 ||
                  uploading
                }
                onClick={() =>
                  setDraft({
                    ...draft,
                    cases: draft.cases.filter((art) => art.id !== item.id),
                    featuredCaseIds: draft.featuredCaseIds.filter(
                      (id) => id !== item.id,
                    ),
                  })
                }
                className="rounded-lg border border-border px-3 py-2"
              >
                {t(locale, "Remove from draft")}
              </button>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2">
                {t(locale, item.before ? "Replace original" : "Add original")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file, index, true);
                  }}
                />
              </label>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-2">
                {t(locale, "Replace artwork")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file, index);
                  }}
                />
              </label>
            </div>
          </div>
        ))}
        <label className="inline-block cursor-pointer rounded-xl border border-border px-4 py-3 text-sm">
          {t(locale, uploading ? "Uploading…" : "Add case artwork")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-debit-text">
            {error}
          </p>
        ) : null}
      </section>
      <section className={section}>
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Generation recipe")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t(
            locale,
            "The user's photo supplies the subject. An optional reference supplies only the visual style. Publish a new version after changing the recipe.",
          )}
        </p>
        <label className="block text-sm font-semibold">
          {t(locale, "Internal prompt")}
          <textarea
            required
            minLength={20}
            maxLength={12000}
            rows={9}
            className={input}
            value={draft.recipe.prompt}
            onChange={(event) => recipe({ prompt: event.target.value })}
          />
        </label>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">
            {t(locale, "Style reference image")}
          </legend>
          <p className="text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              draft.recipe.referenceInputOrder === "subject-first"
                ? "Image 1 is the user's photo; image 2 is the style reference. Keep these numbers consistent in the prompt. Without a reference, only the user's photo is sent."
                : "Image 1 is the style reference; image 2 is the user's photo (historical order). Keep these numbers consistent in the prompt. Without a reference, only the user's photo is sent.",
            )}
          </p>
          {draft.recipe.referenceImage ? (
            <>
              <Image
                {...draft.recipe.referenceImage}
                alt={t(locale, "Style reference image")}
                unoptimized
                className="h-48 w-full rounded-xl bg-secondary object-contain"
              />
              <button
                type="button"
                disabled={uploading}
                className="artora-quiet-action text-sm"
                onClick={() =>
                  recipe({
                    inputMode: "single-photo",
                    referenceImage: undefined,
                  })
                }
              >
                {t(locale, "Remove style reference")}
              </button>
            </>
          ) : null}
          <label className="inline-block cursor-pointer rounded-xl border border-border px-4 py-3 text-sm">
            {t(locale, uploading ? "Uploading…" : "Upload style reference")}
            <input
              type="file"
              aria-label={t(locale, "Upload style reference")}
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file, undefined, false, true);
              }}
            />
          </label>
        </fieldset>
        <label className="block text-sm font-semibold">
          {t(locale, "Fixed style rule")}
          <textarea
            required
            minLength={20}
            maxLength={6000}
            rows={5}
            className={input}
            value={draft.recipe.rule}
            onChange={(event) => recipe({ rule: event.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t(locale, "Default output ratio")}
          <select
            className={input}
            value={draft.recipe.aspectRatio}
            onChange={(event) =>
              recipe({
                aspectRatio: event.target
                  .value as CreativeDefinition["recipe"]["aspectRatio"],
              })
            }
          >
            {ART_ASPECT_RATIOS.map((ratio) => (
              <option key={ratio}>{ratio}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            {t(locale, "Compatible models")}
          </legend>
          <div className="space-y-3">
            {[
              ...artModels,
              { id: "fal-ai/flux-pro/kontext", label: "FLUX.1 Kontext Pro" },
            ].map((model) => (
              <label key={model.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.recipe.modelIds.includes(model.id)}
                  disabled={
                    Boolean(draft.recipe.referenceImage) &&
                    !supportsStyleReference(model.id) &&
                    !draft.recipe.modelIds.includes(model.id)
                  }
                  onChange={(event) =>
                    recipe({
                      modelIds: event.target.checked
                        ? [...draft.recipe.modelIds, model.id]
                        : draft.recipe.modelIds.filter((id) => id !== model.id),
                    })
                  }
                />
                {model.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          {t(locale, "Default model")}
          <select
            className={input}
            value={draft.recipe.defaultModel}
            onChange={(event) => recipe({ defaultModel: event.target.value })}
          >
            {draft.recipe.modelIds.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
        <details>
          <summary className="cursor-pointer text-sm">
            {t(locale, "User option definitions (JSON)")}
          </summary>
          <p className="mt-3 text-xs text-muted-foreground">
            {t(
              locale,
              "Each option needs key, bilingual label and placeholder, and maxLength. Values are supplied separately to the server recipe.",
            )}
          </p>
          <textarea
            aria-label={t(locale, "User option definitions (JSON)")}
            rows={8}
            className={`${input} font-mono text-xs`}
            value={fieldsJson}
            onChange={(event) => setFieldsJson(event.target.value)}
          />
          {!fieldsValid ? (
            <p role="alert">{t(locale, "Enter valid JSON before saving.")}</p>
          ) : null}
        </details>
      </section>
      <section className={section}>
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Testing and publication")}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.recipe.tested}
            onChange={(event) => recipe({ tested: event.target.checked })}
          />
          {t(locale, "A real model test has been recorded")}
        </label>
        <label className="block text-sm">
          {t(locale, "Test report")}
          <textarea
            className={input}
            rows={4}
            maxLength={4000}
            required={draft.recipe.tested}
            value={draft.recipe.testReport}
            onChange={(event) => recipe({ testReport: event.target.value })}
          />
        </label>
        <p className="text-xs leading-6 text-muted-foreground">
          {t(
            locale,
            "Save and test creates a private administrator snapshot. Creating a test artwork uses normal credits. Publishing retains old versions and does not automatically change availability.",
          )}
        </p>
        <button
          type="button"
          className="artora-quiet-action text-sm"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(definition, null, 2)], {
                type: "application/json",
              }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `${draft.id}.json`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          {t(locale, "Export draft package")}
        </button>
      </section>
      <DraftButtons locale={locale} />
    </form>
  );
}
