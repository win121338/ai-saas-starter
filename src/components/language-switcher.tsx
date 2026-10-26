"use client";

import { useLocale } from "@/components/locale-provider";
import { localizedHref, stripLocale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const locale = useLocale();

  function switchLanguage() {
    const { pathname, search, hash } = window.location;
    const next = localizedHref(
      stripLocale(pathname),
      locale === "en" ? "zh" : "en",
    );
    window.location.assign(`${next}${search}${hash}`);
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label={locale === "en" ? "Switch to Chinese" : "切换到英语"}
      title={locale === "en" ? "Switch to Chinese" : "切换到英语"}
    >
      {locale === "en" ? "中文" : "English"}
    </button>
  );
}
