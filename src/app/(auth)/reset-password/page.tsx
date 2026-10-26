import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Set new password") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const locale = await getLocale();

  if (!token) {
    return (
      <div className="grid gap-4">
        <p className="eyebrow">{t(locale, "Reset password")}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            locale,
            "This link is missing its token — request a fresh one from the",
          )}{" "}
          <Link
            href={localizedHref("/forgot-password", locale)}
            className="link-pop"
          >
            {t(locale, "reset page")}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">{t(locale, "Reset password")}</p>
        <h1 className="mt-2 text-2xl">{t(locale, "Choose a new password")}</h1>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
