import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CreativeStudio } from "@/components/generate/creative-studio";
import { requireSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getCreativeVersion,
  listPublishedCreativeTemplates,
} from "@/lib/creative/catalog";
import { artModelAvailable, FAL_MODEL } from "@/lib/art/provider";
import {
  artModels,
  supportsStyleReference,
} from "@/config/image-model-catalog";
import { getSiteAnnouncement, listModelSettings } from "@/lib/admin/settings";
import { env } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n-copy";
import { adaptableCanvasText } from "@/lib/creative/schema";
import { artAspectRatioSchema } from "@/config/art-aspect-ratios";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Studio"), robots: { index: false } };
}

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{
    style?: string;
    previewVersion?: string;
    ratio?: string;
    model?: string;
  }>;
}) {
  await requireSession();
  const locale = await getLocale();
  const params = await searchParams;
  const initialRatio = artAspectRatioSchema.safeParse(params.ratio);
  const initialModel = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .safeParse(params.model);
  const preview = params.previewVersion !== undefined;
  if (preview) await requireAdmin();
  const [rows, settings, announcement] = await Promise.all([
    preview ? Promise.resolve([]) : listPublishedCreativeTemplates("creation"),
    listModelSettings(),
    getSiteAnnouncement(),
  ]);
  const previewVersion = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(params.previewVersion);
  const previewDefinition =
    preview && params.style && previewVersion.success
      ? await getCreativeVersion(params.style, previewVersion.data)
      : null;
  if (preview && !previewDefinition) notFound();
  const availableModels =
    env.ART_PROVIDER === "fal"
      ? [{ id: FAL_MODEL, label: "FLUX.1 Kontext Pro" }]
      : artModels.filter(
          (model) => artModelAvailable(model.id) && settings[model.id],
        );
  const active = previewDefinition
    ? [
        {
          definition: previewDefinition,
          version: previewVersion.success ? previewVersion.data : 0,
        },
      ]
    : rows
        .filter(
          (row) => row.creationEnabled && row.published && row.activeVersion,
        )
        .map((row) => ({
          definition: row.published!,
          version: row.activeVersion!,
        }));
  // Never serialize the server recipe or private manuscripts.
  const templates = active.map(({ definition: item, version }) => ({
    id: item.id,
    name: item.name,
    summary: item.summary,
    suitability: {
      en: adaptableCanvasText(item.suitability.en),
      zh: adaptableCanvasText(item.suitability.zh),
    },
    version,
    cover: item.cases.find((art) => art.id === item.coverCaseId)!.thumbnail,
    samples: item.cases
      .slice(0, 3)
      .map((art) => ({ image: art.thumbnail, title: art.title })),
    fields: item.recipe.fields,
    aspectRatio: item.recipe.aspectRatio,
    tested: item.recipe.tested,
    usesReference: Boolean(item.recipe.referenceImage),
    defaultModel: item.recipe.defaultModel,
    models: availableModels
      .filter(
        (model) =>
          item.recipe.modelIds.includes(model.id) &&
          (!item.recipe.referenceImage || supportsStyleReference(model.id)),
      )
      .map(({ id, label }) => ({ id, label })),
  }));
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-7">
      <div>
        <p className="case-eyebrow">{t(locale, "Your creative workspace")}</p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">
          {t(locale, "Make it your own.")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t(
            locale,
            "Choose a template, upload your photo, and create your version.",
          )}
        </p>
      </div>
      {announcement ? (
        <p className="artora-surface p-4 text-sm">{announcement}</p>
      ) : null}
      <CreativeStudio
        templates={templates}
        initialId={params.style ?? ""}
        initialRatio={initialRatio.success ? initialRatio.data : undefined}
        initialModel={
          params.model === undefined
            ? undefined
            : initialModel.success
              ? initialModel.data
              : ""
        }
        locale={locale}
        preview={preview}
        isDemo={env.ART_PROVIDER === "mock"}
      />
    </div>
  );
}
