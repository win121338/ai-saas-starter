import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { adminAuditEvents, artJobs, subscriptions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getLocale();
  const [[members], [activeSubscriptions], [jobs], [pending], activity] =
    await Promise.all([
      db.select({ count: count() }).from(users),
      db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
      db.select({ count: count() }).from(artJobs),
      db
        .select({ count: count() })
        .from(artJobs)
        .where(eq(artJobs.status, "needs_reconciliation")),
      db
        .select()
        .from(adminAuditEvents)
        .orderBy(desc(adminAuditEvents.createdAt))
        .limit(8),
    ]);
  const cards = [
    ["Members", members.count],
    ["Active subscriptions", activeSubscriptions.count],
    ["Image jobs", jobs.count],
    ["Needs checking", pending.count],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="artora-surface p-5">
            <p className="text-sm text-muted-foreground">{t(locale, label)}</p>
            <p className="mt-3 font-heading text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Recent admin activity")}
        </h2>
        {activity.length ? (
          <ul className="mt-4 divide-y divide-border">
            {activity.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span>
                  {event.action} · {event.targetId}
                </span>
                <time className="text-muted-foreground">
                  {event.createdAt.toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {t(locale, "No admin changes yet.")}
          </p>
        )}
      </section>
    </div>
  );
}
