import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { artJobs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const statusFilter = z.enum([
  "all",
  "queued",
  "submitting",
  "processing",
  "completed",
  "failed",
  "refund_pending",
  "needs_reconciliation",
]);

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const locale = await getLocale();
  const requested = (await searchParams).status;
  const status = statusFilter.catch("all").parse(requested ?? "all");
  const rows = await db
    .select({
      id: artJobs.id,
      email: users.email,
      styleSlug: artJobs.styleSlug,
      model: artJobs.model,
      provider: artJobs.provider,
      status: artJobs.status,
      failureCode: artJobs.failureCode,
      costCredits: artJobs.costCredits,
      createdAt: artJobs.createdAt,
      finishedAt: artJobs.finishedAt,
    })
    .from(artJobs)
    .innerJoin(users, eq(users.id, artJobs.userId))
    .where(status === "all" ? undefined : eq(artJobs.status, status))
    .orderBy(desc(artJobs.createdAt))
    .limit(100);
  return (
    <section className="artora-surface p-5">
      <h2 className="font-heading text-xl font-bold">
        {t(locale, "Image jobs")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(
          locale,
          "Latest 100 jobs. Images remain private to their owners; this page shows operational status only.",
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {statusFilter.options.map((item) => (
          <Link
            key={item}
            href={localizedHref(`/admin/jobs?status=${item}`, locale)}
            className={`rounded-full border px-3 py-1.5 ${status === item ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            {t(locale, item.replaceAll("_", " "))}
          </Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3">{t(locale, "Member")}</th>
              <th className="px-3 py-3">{t(locale, "Style")}</th>
              <th className="px-3 py-3">{t(locale, "Model")}</th>
              <th className="px-3 py-3">{t(locale, "Status")}</th>
              <th className="px-3 py-3">{t(locale, "Failure")}</th>
              <th className="px-3 py-3">{t(locale, "Credits")}</th>
              <th className="px-3 py-3">{t(locale, "Created")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((job) => (
              <tr key={job.id} className="border-b border-border/70">
                <td className="px-3 py-3">
                  {job.email}
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {job.id}
                  </span>
                </td>
                <td className="px-3 py-3">{job.styleSlug}</td>
                <td className="px-3 py-3">{job.model}</td>
                <td className="px-3 py-3">{job.status}</td>
                <td className="px-3 py-3">
                  {job.failureCode ? (
                    <>
                      <span>{t(locale, job.failureCode)}</span>
                      {t(locale, job.failureCode) !== job.failureCode ? (
                        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                          {job.failureCode}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3">{job.costCredits}</td>
                <td className="px-3 py-3">
                  {job.createdAt.toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? (
          <p className="py-5 text-sm text-muted-foreground">
            {t(locale, "No jobs match this filter.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
