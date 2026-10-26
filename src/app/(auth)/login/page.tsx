import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { features } from "@/lib/env";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Sign in") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const locale = await getLocale();
  // Same-origin paths only — never redirect to a caller-supplied host.
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? localizedHref(next, locale)
      : localizedHref("/dashboard", locale);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t(locale, "Artora account")}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          {t(locale, "Welcome back.")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t(locale, "Sign in to your creative workspace.")}
        </p>
      </div>
      <OAuthButtons
        google={features.googleOAuth}
        github={features.githubOAuth}
        next={safeNext}
      />
      <LoginForm magicLink={features.email} next={safeNext} />
      <p className="text-sm text-muted-foreground">
        {t(locale, "No account?")}{" "}
        <Link
          href={localizedHref(
            `/signup?next=${encodeURIComponent(safeNext)}`,
            locale,
          )}
          className="font-semibold text-primary hover:underline"
        >
          {t(locale, "Create one")}
        </Link>
      </p>
    </div>
  );
}
