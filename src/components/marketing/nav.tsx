import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/auth/session";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

import { MobileMenu } from "./nav-mobile";

const links = [
  { href: "/styles", label: "Styles" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
] as const;

export async function MarketingNav() {
  const [locale, session] = await Promise.all([getLocale(), getSession()]);
  const localizedLinks = links.map((link) => ({
    href: localizedHref(link.href, locale),
    label: t(locale, link.label),
  }));
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center gap-5 px-5 md:px-6">
        <Link
          href={localizedHref("/", locale)}
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-tight"
        >
          <LogoMark className="size-8" />
          {siteConfig.name}
        </Link>
        <nav
          className="ml-auto hidden items-center gap-8 lg:flex"
          aria-label={t(locale, "Main navigation")}
        >
          {localizedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <LanguageSwitcher />
          {!session ? (
            <Link
              href={localizedHref("/login", locale)}
              className="hidden text-sm font-semibold text-foreground hover:text-primary sm:inline-flex"
            >
              {t(locale, "Sign in")}
            </Link>
          ) : null}
          <div className="hidden sm:block">
            <Link
              href={localizedHref("/generate", locale)}
              className="artora-action min-h-10 px-4 text-sm"
            >
              {t(locale, "Open studio")}{" "}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
          <MobileMenu
            links={localizedLinks}
            locale={locale}
            signedIn={Boolean(session)}
          />
        </div>
      </div>
    </header>
  );
}
