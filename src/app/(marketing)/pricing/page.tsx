import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "Pricing"),
    description:
      locale === "zh"
        ? "了解 Artora 的方案。最终价格与积分正在验证中。"
        : "See how Artora plans will work. Final prices and credits are being verified.",
  };
}

const options = [
  {
    name: "Explore",
    type: "Try the studio",
    details: [
      "Browse every art style",
      "Preview your own photo locally",
      "No payment needed for the preview",
    ],
  },
  {
    name: "Credit packs",
    type: "Planned",
    details: [
      "Buy credits when you need them",
      "Choose the styles you love",
      "Details announced after model testing",
    ],
  },
  {
    name: "Membership",
    type: "Planned",
    details: [
      "A monthly creative allowance",
      "Manage or cancel your plan",
      "Details announced before checkout opens",
    ],
  },
] as const;

export default async function PricingPage() {
  const locale = await getLocale();
  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-20 md:px-6 md:pt-24">
        <div className="mx-auto max-w-[720px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="size-3.5" aria-hidden />{" "}
            {t(locale, "Simple choices")}
          </span>
          <h1 className="mt-7 font-heading text-[clamp(3rem,5vw,4.5rem)] font-extrabold tracking-[-0.045em]">
            {t(locale, "Create on your terms.")}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {t(
              locale,
              "We are testing the generation experience and its costs. Final prices and credit amounts will be published before checkout opens.",
            )}
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {options.map((option, index) => (
            <div
              key={option.name}
              className={`artora-surface flex flex-col p-7 ${index === 1 ? "border-primary/50" : ""}`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">
                {t(locale, option.type)}
              </span>
              <h2 className="mt-5 font-heading text-3xl font-bold">
                {t(locale, option.name)}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {index === 0
                  ? t(locale, "Available in this preview")
                  : t(locale, "Price to be announced")}
              </p>
              <div className="my-7 h-px bg-border" />
              <ul className="flex-1 space-y-4">
                {option.details.map((detail) => (
                  <li key={detail} className="flex gap-3 text-sm leading-6">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />{" "}
                    {t(locale, detail)}
                  </li>
                ))}
              </ul>
              {index === 0 ? (
                <Link
                  href={localizedHref("/generate", locale)}
                  className="artora-action mt-9"
                >
                  {t(locale, "Open studio")}{" "}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span className="artora-quiet-action mt-9 cursor-default text-muted-foreground">
                  {t(locale, "Coming after testing")}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mx-auto mt-9 max-w-[750px] text-center text-sm leading-7 text-muted-foreground">
          {t(
            locale,
            "The original starter's prices are not Artora offers. The live purchase flow remains closed during this design phase.",
          )}
        </p>
      </div>
    </div>
  );
}
