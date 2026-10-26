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

export function ForgotPasswordForm() {
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const email = z
      .email()
      .safeParse(new FormData(event.currentTarget).get("email"));
    if (!email.success) {
      setError(t(locale, "Enter a valid email address"));
      return;
    }
    setPending(true);
    const { error: requestError } = await authClient.requestPasswordReset({
      email: email.data,
      redirectTo: localizedHref("/reset-password", locale),
    });
    setPending(false);
    if (requestError) {
      setError(
        requestError.message ?? t(locale, "Could not send the reset email"),
      );
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(
          locale,
          "If an account exists for that address, a reset link is on its way.",
        )}
      </p>
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
      {error ? <p className="text-sm text-debit-text">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {t(locale, pending ? "Sending…" : "Send reset link")}
      </Button>
    </form>
  );
}
