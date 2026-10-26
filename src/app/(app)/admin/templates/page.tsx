import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { artStyleTemplateVersions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { listConfiguredArtStyles } from "@/lib/art/templates";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";
import { publishTemplateAction, updateStyleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string; result?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const params = await searchParams;
  const requestedStyle = z
    .string()
    .catch("")
    .parse(params.style ?? "");
  const styles = await listConfiguredArtStyles();
  const selected =
    styles.find((style) => style.slug === requestedStyle) ?? styles[0];
  const history = await db
    .select({
      version: artStyleTemplateVersions.version,
      createdAt: artStyleTemplateVersions.createdAt,
    })
    .from(artStyleTemplateVersions)
    .where(eq(artStyleTemplateVersions.slug, selected.slug))
    .orderBy(desc(artStyleTemplateVersions.version))
    .limit(6);
  return (
    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="artora-surface h-fit p-3">
        {styles.map((style) => (
          <Link
            key={style.slug}
            href={localizedHref(`/admin/templates?style=${style.slug}`, locale)}
            className={`block rounded-xl px-4 py-3 text-sm ${style.slug === selected.slug ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <span className="font-semibold">{t(locale, style.name)}</span>
            <span className="mt-1 block text-xs">
              v{style.version} ·{" "}
              {style.enabled ? t(locale, "Enabled") : t(locale, "Disabled")}
            </span>
          </Link>
        ))}
      </aside>
      <div className="space-y-6">
        {params.result === "saved" ? (
          <p
            role="status"
            className="artora-surface border-primary/30 p-4 text-sm text-primary"
          >
            {t(locale, "Changes saved.")}
          </p>
        ) : null}
        {params.result === "invalid" ? (
          <p
            role="alert"
            className="artora-surface border-red-400/35 p-4 text-sm text-debit-text"
          >
            {t(locale, "Check the form values and try again.")}
          </p>
        ) : null}
        <section className="artora-surface p-5">
          <h2 className="font-heading text-xl font-bold">
            {t(locale, "Style listing")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              locale,
              "Name, sample image, and availability apply to the public style library and new studio jobs.",
            )}
          </p>
          <form action={updateStyleAction} className="mt-5 space-y-4">
            <input type="hidden" name="slug" value={selected.slug} />
            <label className="block text-sm font-semibold">
              {t(locale, "Display name")}
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={60}
                defaultValue={selected.name}
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              {t(locale, "Sample image URL")}
              <input
                name="sampleImageUrl"
                type="url"
                placeholder="https://..."
                defaultValue={selected.sampleImageUrl ?? ""}
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
              />
            </label>
            {selected.sampleImageUrl ? (
              <div className="relative h-40 max-w-xs overflow-hidden rounded-xl border border-border">
                <Image
                  src={selected.sampleImageUrl}
                  alt={selected.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={selected.enabled}
                className="accent-primary"
              />
              {t(locale, "Available to users")}
            </label>
            <button type="submit" className="artora-action px-5 text-sm">
              {t(locale, "Save style listing")}
            </button>
          </form>
        </section>
        <section className="artora-surface p-5">
          <h2 className="font-heading text-xl font-bold">
            {t(locale, "Prompt template")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              locale,
              "Publishing creates a new immutable version. Existing jobs keep their saved version; the fixed rule remains after user edits.",
            )}
          </p>
          <form action={publishTemplateAction} className="mt-5 space-y-4">
            <input type="hidden" name="slug" value={selected.slug} />
            <label className="block text-sm font-semibold">
              {t(locale, "Default editable prompt")}
              <textarea
                name="preset"
                required
                minLength={3}
                maxLength={2000}
                rows={6}
                defaultValue={selected.preset}
                className="mt-2 w-full resize-y rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-6"
              />
            </label>
            <label className="block text-sm font-semibold">
              {t(locale, "Fixed style rule")}
              <textarea
                name="rule"
                required
                minLength={20}
                maxLength={1000}
                rows={4}
                defaultValue={selected.rule}
                className="mt-2 w-full resize-y rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-6"
              />
            </label>
            <button type="submit" className="artora-action px-5 text-sm">
              {t(locale, "Publish new version")}
            </button>
          </form>
          <div className="mt-7 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">
              {t(locale, "Published history")}
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {history.map((entry) => (
                <li key={entry.version}>
                  v{entry.version} ·{" "}
                  {entry.createdAt.toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </li>
              ))}
              <li>v3 · {t(locale, "Built-in version")}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
