import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { siteConfig } from "@/config/site";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <div className="artora-shell flex min-h-dvh flex-col">
      <header className="flex h-[72px] items-center justify-between border-b border-border px-5 md:px-8">
        <Link
          href={localizedHref("/", locale)}
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold"
        >
          <LogoMark className="size-8" /> {siteConfig.name}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href={localizedHref("/styles", locale)}
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {t(locale, "Explore styles")}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="artora-surface w-full max-w-[440px] p-7 sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
