import { desc, inArray, isNotNull, eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin/auth";
import { getStripe } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  customerId: string;
  amount: number;
  amountRefunded: number;
  currency: string;
  status: string;
  createdAt: Date;
};

export default async function OrdersPage() {
  await requireAdmin();
  const locale = await getLocale();
  const subscriptionRows = await db
    .select({
      userId: users.id,
      email: users.email,
      stripeCustomerId: users.stripeCustomerId,
      status: subscriptions.status,
      priceId: subscriptions.priceId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      updatedAt: subscriptions.updatedAt,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(50);
  let payments: PaymentRow[] = [];
  let stripeState: "unconfigured" | "ready" | "unavailable" = "unconfigured";
  if (env.STRIPE_SECRET_KEY) {
    try {
      const result = await getStripe().charges.list({ limit: 50 });
      const customerIds = result.data
        .map((charge) =>
          typeof charge.customer === "string"
            ? charge.customer
            : charge.customer?.id,
        )
        .filter((id): id is string => Boolean(id));
      const known = customerIds.length
        ? await db
            .select({ id: users.stripeCustomerId })
            .from(users)
            .where(inArray(users.stripeCustomerId, customerIds))
        : [];
      const knownIds = new Set(known.map((row) => row.id));
      payments = result.data.flatMap((charge) => {
        const customerId =
          typeof charge.customer === "string"
            ? charge.customer
            : charge.customer?.id;
        if (!customerId || !knownIds.has(customerId)) return [];
        return [
          {
            id: charge.id,
            customerId,
            amount: charge.amount,
            amountRefunded: charge.amount_refunded,
            currency: charge.currency,
            status: charge.status,
            createdAt: new Date(charge.created * 1000),
          },
        ];
      });
      stripeState = "ready";
    } catch {
      stripeState = "unavailable";
    }
  }
  const customerRows = await db
    .select({ id: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(isNotNull(users.stripeCustomerId));
  const customerEmail = new Map(customerRows.map((row) => [row.id, row.email]));
  const money = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat(
      locale === "zh" ? "zh-CN" : "en-US",
      {
        style: "currency",
        currency: currency.toUpperCase(),
      },
    );
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(amount / 10 ** digits);
  };
  return (
    <div className="space-y-6">
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Recent Stripe payments")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            locale,
            "Read-only view of this site's payments among the 50 most recent Stripe charges. Refunds must be handled in Stripe.",
          )}
        </p>
        {stripeState === "unconfigured" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t(locale, "Stripe is not configured for this environment.")}
          </p>
        ) : null}
        {stripeState === "unavailable" ? (
          <p role="alert" className="mt-4 text-sm text-debit-text">
            {t(locale, "Stripe could not be reached. Try again later.")}
          </p>
        ) : null}
        {stripeState === "ready" ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">{t(locale, "Member")}</th>
                  <th className="px-3 py-3">{t(locale, "Payment ID")}</th>
                  <th className="px-3 py-3">{t(locale, "Amount")}</th>
                  <th className="px-3 py-3">{t(locale, "Refunded")}</th>
                  <th className="px-3 py-3">{t(locale, "Status")}</th>
                  <th className="px-3 py-3">{t(locale, "Date")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/70">
                    <td className="px-3 py-3">
                      {customerEmail.get(payment.customerId) ??
                        payment.customerId}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {payment.id}
                    </td>
                    <td className="px-3 py-3">
                      {money(payment.amount, payment.currency)}
                    </td>
                    <td className="px-3 py-3">
                      {money(payment.amountRefunded, payment.currency)}
                    </td>
                    <td className="px-3 py-3">{payment.status}</td>
                    <td className="px-3 py-3">
                      {payment.createdAt.toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!payments.length ? (
              <p className="py-5 text-sm text-muted-foreground">
                {t(locale, "No payments found in the recent Stripe window.")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
      <section className="artora-surface p-5">
        <h2 className="font-heading text-xl font-bold">
          {t(locale, "Subscription sync")}
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-3">{t(locale, "Member")}</th>
                <th className="px-3 py-3">{t(locale, "Status")}</th>
                <th className="px-3 py-3">{t(locale, "Price ID")}</th>
                <th className="px-3 py-3">{t(locale, "Period end")}</th>
                <th className="px-3 py-3">{t(locale, "Last synced")}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionRows.map((row) => (
                <tr key={row.userId} className="border-b border-border/70">
                  <td className="px-3 py-3">{row.email}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {row.priceId ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row.currentPeriodEnd?.toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    ) ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row.updatedAt.toLocaleString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!subscriptionRows.length ? (
            <p className="py-5 text-sm text-muted-foreground">
              {t(locale, "No synced subscriptions yet.")}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
