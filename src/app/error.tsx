"use client";

import * as React from "react";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

// Route-segment error boundary — renders inside the root layout, so the
// theme and fonts still apply. Errors surface as human sentences with a
// next step; the digest stays in the server logs, not in the UI.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="artora-shell flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
        <Sparkles className="size-7 text-primary" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {t(locale, "A pause in the process")}
      </p>
      <h1 className="font-heading text-3xl font-bold">
        {t(locale, "Something went wrong.")}
      </h1>
      <p className="max-w-md leading-7 text-muted-foreground">
        {t(
          locale,
          "Please try again. If this happens again, come back in a moment.",
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="artora-action">
          {t(locale, "Try again")}
        </button>
        <Link href={localizedHref("/", locale)} className="artora-quiet-action">
          {t(locale, "Back to home")}
        </Link>
      </div>
    </div>
  );
}
