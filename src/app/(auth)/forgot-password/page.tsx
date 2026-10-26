import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { features } from "@/lib/env";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await getLocale(), "Reset password") };
}

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">{t(locale, "Reset password")}</p>
        <h1 className="mt-2 text-2xl">{t(locale, "Forgot your password?")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(locale, "Enter your email and we send a reset link.")}
        </p>
      </div>
      <ForgotPasswordForm canSendEmail={features.email} />
    </div>
  );
}
