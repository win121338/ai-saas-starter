"use client";

import * as React from "react";

import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { BusyButton } from "@/components/busy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function EmailForm({
  email,
  canSendEmail,
}: {
  email: string;
  canSendEmail: boolean;
}) {
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = z
      .email("Enter a valid email address")
      .safeParse(new FormData(event.currentTarget).get("email"));
    if (!parsed.success) {
      toast.error(
        t(locale, parsed.error.issues[0]?.message ?? "Check your input"),
      );
      return;
    }
    if (parsed.data === email) {
      toast.error(t(locale, "That is already your email address"));
      return;
    }
    setPending(true);
    const { error } = await authClient.changeEmail({
      newEmail: parsed.data,
      callbackURL: localizedHref("/settings", locale),
    });
    setPending(false);
    if (error) {
      toast.error(
        error.message ?? t(locale, "Could not start the email change"),
      );
      return;
    }
    toast.success(
      canSendEmail
        ? t(locale, "Check your current inbox to approve the change")
        : t(locale, "Email updated"),
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm items-end gap-2">
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="settings-email">{t(locale, "Email")}</Label>
        <Input
          id="settings-email"
          name="email"
          type="email"
          defaultValue={email}
          required
        />
      </div>
      <BusyButton
        type="submit"
        variant="outline"
        busy={pending}
        busyLabel={t(locale, "Saving…")}
      >
        {t(locale, "Change")}
      </BusyButton>
    </form>
  );
}
