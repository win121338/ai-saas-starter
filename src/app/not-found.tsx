import Link from "next/link";
import { Sparkles } from "lucide-react";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <div className="artora-shell flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
        <Sparkles className="size-7 text-primary" aria-hidden />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {t(locale, "Page not found")}
      </p>
      <h1 className="mt-3 font-heading text-6xl font-extrabold">404</h1>
      <p className="mt-4 max-w-md leading-7 text-muted-foreground">
        {t(
          locale,
          "This page may have moved. Head back and find a creative direction that fits.",
        )}
      </p>
      <Link href={localizedHref("/", locale)} className="artora-action mt-7">
        {t(locale, "Back to home")}
      </Link>
    </div>
  );
}
