"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function MobileMenu({
  links,
  locale,
  signedIn,
}: {
  links: readonly { href: string; label: string }[];
  locale: Locale;
  signedIn: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t(locale, open ? "Close menu" : "Open menu")}
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card"
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>
      {open ? (
        <nav
          className="absolute inset-x-0 top-full border-b border-border bg-background p-5 shadow-xl"
          aria-label={t(locale, "Mobile navigation")}
        >
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
            <Link
              href={localizedHref("/generate", locale)}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-primary sm:hidden"
            >
              {t(locale, "Open studio")}
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!signedIn ? (
              <Link
                href={localizedHref("/login", locale)}
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-muted-foreground sm:hidden"
              >
                {t(locale, "Sign in")}
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
