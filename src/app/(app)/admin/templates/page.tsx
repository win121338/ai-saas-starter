import Image from "next/image";
import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/db";
import { artJobs, creativeTemplateVersions } from "@/db/schema";
import { listCreativeTemplates } from "@/lib/creative/catalog";
import { CreativeEditor } from "@/components/admin/creative-editor";
import LegacyTemplatesPage from "@/components/admin/legacy-templates";
import { getLocale } from "@/lib/i18n-server";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import {
  creativeActivateAction,
  creativeAvailabilityAction,
  creativeImportAction,
  creativeLocalImportAction,
} from "./creative-actions";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    style?: string;
    archive?: string;
    result?: string;
    error?: string;
    q?: string;
  }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const locale = await getLocale();
  if (params.archive === "1")
    return (
      <div className="space-y-6">
        <Link
          href={localizedHref("/admin/templates", locale)}
          className="text-sm text-primary"
        >
          {t(locale, "Back to creative templates")}
        </Link>
        <p className="text-sm text-muted-foreground">
          {t(
            locale,
            "Archived styles are retained for historical jobs. They cannot accept new studio jobs.",
          )}
        </p>
        <LegacyTemplatesPage searchParams={Promise.resolve(params)} />
      </div>
    );
  const rows = await listCreativeTemplates();
  const query = (params.q ?? "").slice(0, 100).toLowerCase();
  const filtered = rows.filter((row) =>
    `${row.id} ${row.draft.name.zh} ${row.draft.name.en} ${row.draft.tags.join(" ")}`
      .toLowerCase()
      .includes(query),
  );
  const selected = rows.find((row) => row.id === params.style) ?? filtered[0];
  const history = selected
    ? await db
        .select()
        .from(creativeTemplateVersions)
        .where(eq(creativeTemplateVersions.templateId, selected.id))
        .orderBy(desc(creativeTemplateVersions.version))
    : [];
  const tests = selected
    ? await db
        .select({
          id: artJobs.id,
          version: artJobs.styleVersion,
          status: artJobs.status,
        })
        .from(artJobs)
        .where(
          and(
            eq(artJobs.styleSlug, selected.id),
            eq(artJobs.isTest, true),
            eq(artJobs.userId, session.user.id),
          ),
        )
        .orderBy(desc(artJobs.createdAt))
        .limit(6)
    : [];
  const stats = selected
    ? (
        await db
          .select({
            total: sql<number>`count(*)::int`,
            completed: sql<number>`count(*) filter (where ${artJobs.status} = 'completed')::int`,
          })
          .from(artJobs)
          .where(
            and(eq(artJobs.styleSlug, selected.id), eq(artJobs.isTest, false)),
          )
      )[0]
    : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">
            {t(locale, "Creative templates")}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {t(
              locale,
              "Manage cases, recipes and availability together. Imported packages update drafts; published versions stay unchanged.",
            )}
          </p>
        </div>
        <Link
          href={localizedHref("/admin/templates?archive=1", locale)}
          className="artora-quiet-action text-sm"
        >
          {t(locale, "Archived styles")}
        </Link>
      </div>
      {params.result === "saved" ? (
        <p role="status" className="artora-surface p-4 text-sm text-primary">
          {t(locale, "Changes saved.")}
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="artora-surface p-4 text-sm text-debit-text">
          {params.error.slice(0, 240)}
        </p>
      ) : null}
      <details className="artora-surface p-5">
        <summary className="cursor-pointer font-semibold">
          {t(locale, "Import a template")}
        </summary>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {t(
            locale,
            "Choose a prepared JSON package to create or update a draft. Media must already be uploaded or included in the approved static assets.",
          )}
        </p>
        <form
          action={creativeImportAction}
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <label className="text-sm">
            {t(locale, "Template package")}
            <input
              type="file"
              name="package"
              accept="application/json,.json"
              required
              className="mt-2 block max-w-full text-xs"
            />
          </label>
          <button className="artora-action text-sm">
            {t(locale, "Import as draft")}
          </button>
        </form>
        <form action={creativeLocalImportAction} className="mt-4">
          <button className="artora-quiet-action text-xs">
            {t(locale, "Import prepared local packages")}
          </button>
        </form>
      </details>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="artora-surface h-fit min-w-0 space-y-3 p-3">
          <form>
            <label className="sr-only" htmlFor="template-search">
              {t(locale, "Search templates")}
            </label>
            <input
              id="template-search"
              name="q"
              defaultValue={params.q}
              placeholder={t(locale, "Search templates")}
              className="w-full rounded-xl border border-border bg-secondary px-3 py-3 text-sm"
            />
            <button className="mt-2 text-xs text-primary">
              {t(locale, "Search")}
            </button>
          </form>
          {filtered.map((row) => {
            const cover = row.draft.cases.find(
              (art) => art.id === row.draft.coverCaseId,
            )!;
            return (
              <Link
                key={row.id}
                href={localizedHref(`/admin/templates?style=${row.id}`, locale)}
                className={`flex items-center gap-3 rounded-xl border p-3 ${row.id === selected?.id ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-secondary"}`}
              >
                <Image
                  {...cover.thumbnail}
                  alt=""
                  sizes="48px"
                  className="size-12 rounded-lg object-contain"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {row.draft.name[locale]}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {row.activeVersion
                      ? `v${row.activeVersion}`
                      : t(locale, "Draft")}{" "}
                    ·{" "}
                    {t(
                      locale,
                      row.creationEnabled
                        ? "Creation enabled"
                        : "Creation disabled",
                    )}
                    {row.featured ? ` · ${t(locale, "Featured")}` : ""}
                  </span>
                </span>
              </Link>
            );
          })}
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {t(locale, "No matching templates.")}
            </p>
          ) : null}
        </aside>
        {selected ? (
          <div className="min-w-0 space-y-6">
            <section className="artora-surface space-y-5 p-5">
              <h2 className="font-heading text-xl font-bold">
                {t(locale, "Availability and promotion")}
              </h2>
              <form action={creativeAvailabilityAction} className="space-y-4">
                <input type="hidden" name="id" value={selected.id} />
                {(
                  ["displayEnabled", "creationEnabled", "featured"] as const
                ).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={key}
                      defaultChecked={selected[key]}
                    />
                    {t(
                      locale,
                      key === "displayEnabled"
                        ? "Show in the case wall"
                        : key === "creationEnabled"
                          ? "Allow new creations"
                          : "Primary featured template (one site-wide)",
                    )}
                  </label>
                ))}
                <label className="block text-sm">
                  {t(locale, "Sort order (lower first)")}
                  <input
                    type="number"
                    name="sortOrder"
                    min={0}
                    max={100000}
                    defaultValue={selected.sortOrder}
                    required
                    className="ml-3 w-24 rounded-lg border border-border bg-secondary px-3 py-2"
                  />
                </label>
                <button className="artora-action text-sm">
                  {t(locale, "Save availability")}
                </button>
              </form>
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                {t(locale, "Customer tasks")}: {stats?.total ?? 0} ·{" "}
                {t(locale, "Completed")}: {stats?.completed ?? 0} ·{" "}
                {t(locale, "Administrator tests excluded")}
              </p>
            </section>
            <CreativeEditor
              key={`${selected.id}:${selected.updatedAt.toISOString()}`}
              initial={selected.draft}
              updatedAt={selected.updatedAt.toISOString()}
              locale={locale}
            />
            <section className="artora-surface space-y-4 p-5">
              <h2 className="font-heading text-xl font-bold">
                {t(locale, "Version history")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t(
                  locale,
                  "Activating an earlier version changes new jobs and public content; the current draft is retained.",
                )}
              </p>
              {history.map((version) => (
                <form
                  key={version.version}
                  action={creativeActivateAction}
                  className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm"
                >
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="version" value={version.version} />
                  <span className="font-mono">v{version.version}</span>
                  <span className="text-xs text-muted-foreground">
                    {version.createdAt.toLocaleString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}
                  </span>
                  {selected.activeVersion === version.version ? (
                    <span className="text-primary">{t(locale, "Active")}</span>
                  ) : (
                    <button className="rounded-lg border border-border px-3 py-2 text-xs">
                      {t(locale, "Activate this version")}
                    </button>
                  )}
                </form>
              ))}
            </section>
            <section className="artora-surface space-y-3 p-5">
              <h2 className="font-heading text-xl font-bold">
                {t(locale, "Your test artworks")}
              </h2>
              {tests.length ? (
                tests.map((job) => (
                  <Link
                    key={job.id}
                    href={localizedHref(`/creations/${job.id}`, locale)}
                    className="block text-sm text-primary"
                  >
                    v{job.version} · {t(locale, job.status)} →
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(locale, "No administrator test tasks yet.")}
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
