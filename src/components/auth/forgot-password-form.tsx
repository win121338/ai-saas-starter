"use client";

import * as React from "react";

import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function ForgotPasswordForm({
  canSendEmail,
}: {
  canSendEmail: boolean;
}) {
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSendEmail || pending) return;
    setError(null);
    const email = z
      .email()
      .safeParse(new FormData(event.currentTarget).get("email"));
    if (!email.success) {
      setError(t(locale, "Enter a valid email address"));
      return;
    }
    setPending(true);
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email: email.data,
        redirectTo: localizedHref("/reset-password", locale),
      });
      if (requestError) {
        setError(
          requestError.message ?? t(locale, "Could not send the reset email"),
        );
        return;
      }
      setSent(true);
    } catch {
      setError(t(locale, "Could not send the reset email"));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-4">
        <p role="status" className="text-sm text-muted-foreground">
          {t(
            locale,
            "Request received. If this address has an account, check your inbox and spam folder for a reset link. If no email arrives, try again or contact the site administrator.",
          )}
        </p>
        <Button type="button" variant="outline" onClick={() => setSent(false)}>
          {t(locale, "Try again")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="forgot-email">{t(locale, "Email")}</Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {!canSendEmail ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t(
            locale,
            "Password reset email is unavailable. Please contact the site administrator to configure email delivery.",
          )}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-debit-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !canSendEmail}>
        {t(locale, pending ? "Sending…" : "Send reset link")}
      </Button>
    </form>
  );
}
