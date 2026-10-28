import Link from "next/link";
import { randomUUID } from "node:crypto";
import { desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { adminMembers, subscriptions, users } from "@/db/schema";
import { isBootstrapOwner, requireAdmin } from "@/lib/admin/auth";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";
import { grantAdminAction } from "../actions";
import { MemberCreditGrant } from "@/components/admin/member-credit-grant";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; result?: string }>;
}) {
  const session = await requireAdmin();
  const locale = await getLocale();
  const params = await searchParams;
  const q = z
    .string()
    .trim()
    .max(100)
    .catch("")
    .parse(params.q ?? "");
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(10_000)
    .catch(1)
    .parse(params.page ?? "1");
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      verified: users.emailVerified,
      balance: users.creditBalance,
      createdAt: users.createdAt,
      subscription: subscriptions.status,
      adminRole: adminMembers.role,
      jobCount: sql<number>`(SELECT count(*)::int FROM art_jobs WHERE user_id = ${users.id} AND deleted_at IS NULL)`,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .leftJoin(adminMembers, eq(adminMembers.userId, users.id))
    .where(q ? ilike(users.email, `%${q}%`) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(31)
    .offset((page - 1) * 30);
  const hasNext = rows.length > 30;
  const members = rows.slice(0, 30);
  const query = (nextPage: number) =>
    localizedHref(
      `/admin/members?page=${nextPage}&q=${encodeURIComponent(q)}`,
      locale,
    );
  return (
    <div className="space-y-6">
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Members")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            locale,
            "Search members by email. Balances are shown from the credit cache.",
          )}
        </p>
        <form
          className="mt-5 flex max-w-lg gap-2"
          action={localizedHref("/admin/members", locale)}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder={t(locale, "Email address")}
            className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-4 py-2 text-sm"
          />
          <button type="submit" className="artora-quiet-action px-4 text-sm">
            {t(locale, "Search")}
          </button>
        </form>
        {params.result === "saved" ? (
          <p role="status" className="mt-4 text-sm text-primary">
            {t(locale, "Administrator granted.")}
          </p>
        ) : null}
        {params.result === "invalid" ? (
          <p role="alert" className="mt-4 text-sm text-debit-text">
            {t(locale, "Could not grant administrator access.")}
          </p>
        ) : null}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-3">{t(locale, "Member")}</th>
                <th className="px-3 py-3">{t(locale, "Joined")}</th>
                <th className="px-3 py-3">{t(locale, "Subscription")}</th>
                <th className="px-3 py-3">{t(locale, "Credits")}</th>
                <th className="px-3 py-3">{t(locale, "Image jobs")}</th>
                <th className="px-3 py-3">{t(locale, "Access")}</th>
                <th className="px-3 py-3">{t(locale, "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <strong>{member.name}</strong>
                    <span className="block text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {member.createdAt.toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}
                  </td>
                  <td className="px-3 py-3">{member.subscription ?? "none"}</td>
                  <td className="px-3 py-3">{member.balance}</td>
                  <td className="px-3 py-3">{member.jobCount}</td>
                  <td className="px-3 py-3">
                    {isBootstrapOwner(member.id)
                      ? "owner"
                      : (member.adminRole ?? "—")}
                  </td>
                  <td className="px-3 py-3">
                    <MemberCreditGrant
                      userId={member.id}
                      email={member.email}
                      balance={member.balance}
                      initialRequestId={randomUUID()}
                      locale={locale}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!members.length ? (
            <p className="py-6 text-sm text-muted-foreground">
              {t(locale, "No members found.")}
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-3 text-sm">
          {page > 1 ? (
            <Link href={query(page - 1)} className="text-primary">
              {t(locale, "Previous")}
            </Link>
          ) : null}
          <span>{page}</span>
          {hasNext ? (
            <Link href={query(page + 1)} className="text-primary">
              {t(locale, "Next")}
            </Link>
          ) : null}
        </div>
      </section>
      {isBootstrapOwner(session.user.id) ? (
        <section className="artora-surface p-5">
          <h2 className="font-heading text-xl font-bold">
            {t(locale, "Grant administrator access")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              locale,
              "Only the bootstrap owner can grant access to an existing account.",
            )}
          </p>
          <form action={grantAdminAction} className="mt-4 flex max-w-lg gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder={t(locale, "Existing member email")}
              className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-4 py-2 text-sm"
            />
            <button type="submit" className="artora-action px-4 text-sm">
              {t(locale, "Grant access")}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
