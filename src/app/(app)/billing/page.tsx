import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Info } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Billing"), robots: { index: false } };
}

export default async function BillingPage() {
  const session = await requireSession();
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-[1000px] space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t(locale, "Account")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t(locale, "Billing & credits")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t(
            locale,
            "The credit pack and membership options are being finalized alongside the image model.",
          )}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
        <div className="artora-surface p-7">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-6" aria-hidden />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {t(locale, "Current credit balance")}
          </p>
          <p className="mt-1 font-heading text-5xl font-extrabold">
            {session.user.creditBalance ?? 0}
          </p>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              "Existing starter credits can be used in the studio demo and the separate text-to-image demo. Final plan prices are still being tested.",
            )}
          </p>
        </div>
        <div className="artora-surface flex flex-col justify-between p-7">
          <div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t(locale, "Payments not open yet")}
            </span>
            <h2 className="mt-6 font-heading text-2xl font-bold">
              {t(locale, "Plans built around the final experience.")}
            </h2>
            <p className="mt-3 max-w-[530px] text-sm leading-7 text-muted-foreground">
              {t(
                locale,
                "We will publish prices and credit amounts after the image provider, prompt presets, and payment flow have been tested. No Artora checkout is available in this phase.",
              )}
            </p>
          </div>
          <Link
            href={localizedHref("/pricing", locale)}
            className="artora-quiet-action mt-7 self-start"
          >
            {t(locale, "See plan preview")}{" "}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
      <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
        <Info className="mt-1 size-4 shrink-0" aria-hidden />{" "}
        {t(
          locale,
          "The starter repository contains sample Stripe prices. They are not live Artora offers.",
        )}
      </p>
    </div>
  );
}
