import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function MarketingFooter() {
  const [locale, session] = await Promise.all([getLocale(), getSession()]);
  return (
    <footer className="border-t border-border bg-[#0e1117]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <Link
            href={localizedHref("/", locale)}
            className="inline-flex items-center gap-2.5 font-heading text-xl font-bold"
          >
            <LogoMark className="size-8" /> {siteConfig.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            {t(
              locale,
              "A place for the photos you love to become something you can keep.",
            )}
          </p>
          <p className="mt-7 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}.{" "}
            {t(locale, "Working preview.")}
          </p>
        </div>
        <nav
          aria-label={t(locale, "Product links")}
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="mb-1 font-semibold text-foreground">
            {t(locale, "Explore")}
          </p>
          <Link
            href={localizedHref("/styles", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, "Styles")}
          </Link>
          <Link
            href={localizedHref("/pricing", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, "Pricing")}
          </Link>
          <Link
            href={localizedHref("/generate", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, "Studio")}
          </Link>
        </nav>
        <nav
          aria-label={t(locale, "Account and legal links")}
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="mb-1 font-semibold text-foreground">
            {t(locale, "More")}
          </p>
          <Link
            href={localizedHref(session ? "/dashboard" : "/login", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, session ? "Your workspace" : "Sign in")}
          </Link>
          <Link
            href={localizedHref("/privacy", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, "Privacy")}
          </Link>
          <Link
            href={localizedHref("/terms", locale)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t(locale, "Terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
