import type { Metadata } from "next";
import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignupForm } from "@/components/auth/signup-form";
import { features } from "@/lib/env";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Create account") };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const locale = await getLocale();
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? localizedHref(next, locale)
      : localizedHref("/dashboard", locale);
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t(locale, "Create account")}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          {t(locale, "Make space for art.")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t(locale, "Save your place in the Artora studio.")}
        </p>
      </div>
      <OAuthButtons
        google={features.googleOAuth}
        github={features.githubOAuth}
        next={safeNext}
      />
      <SignupForm requiresVerification={features.email} next={safeNext} />
      <p className="text-sm text-muted-foreground">
        {t(locale, "Already registered?")}{" "}
        <Link
          href={localizedHref(
            `/login?next=${encodeURIComponent(safeNext)}`,
            locale,
          )}
          className="font-semibold text-primary hover:underline"
        >
          {t(locale, "Sign in")}
        </Link>
      </p>
    </div>
  );
}
