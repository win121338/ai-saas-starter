import { desc } from "drizzle-orm";

import { db } from "@/db";
import { adminAuditEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAdmin();
  const locale = await getLocale();
  const events = await db
    .select()
    .from(adminAuditEvents)
    .orderBy(desc(adminAuditEvents.createdAt))
    .limit(100);
  return (
    <section className="artora-surface p-5">
      <h2 className="font-heading text-xl font-bold">
        {t(locale, "Audit log")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t(
          locale,
          "Latest 100 administrator changes. Secret values and full prompts are not stored here.",
        )}
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3">{t(locale, "Date")}</th>
              <th className="px-3 py-3">{t(locale, "Actor ID")}</th>
              <th className="px-3 py-3">{t(locale, "Action")}</th>
              <th className="px-3 py-3">{t(locale, "Target")}</th>
              <th className="px-3 py-3">{t(locale, "Details")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-border/70">
                <td className="px-3 py-3">
                  {event.createdAt.toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </td>
                <td className="px-3 py-3 font-mono text-xs">
                  {event.actorUserId}
                </td>
                <td className="px-3 py-3">{event.action}</td>
                <td className="px-3 py-3">
                  {event.targetType} · {event.targetId}
                </td>
                <td className="px-3 py-3 font-mono text-xs">
                  {event.details ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length ? (
          <p className="py-5 text-sm text-muted-foreground">
            {t(locale, "No admin changes yet.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
