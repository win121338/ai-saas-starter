"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
  emailVerified,
  canSendEmail,
}: {
  email: string;
  emailVerified: boolean;
  canSendEmail: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const unavailable = emailVerified && !canSendEmail;
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || unavailable) return;
    const parsed = z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address"))
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
    try {
      const { error } = await authClient.changeEmail({
        newEmail: parsed.data,
        callbackURL: localizedHref("/settings", locale),
      });
      if (error) {
        toast.error(
          error.message ?? t(locale, "Could not start the email change"),
        );
        return;
      }
      if (!canSendEmail) {
        const { data } = await authClient.getSession();
        if (data?.user.email !== parsed.data) {
          toast.error(t(locale, "Could not start the email change"));
          return;
        }
        router.refresh();
      }
      toast.success(
        canSendEmail
          ? t(
              locale,
              emailVerified
                ? "Approve the change in your current inbox, then verify your new email."
                : "Check your new inbox to verify the email change.",
            )
          : t(locale, "Email updated"),
      );
    } catch {
      toast.error(t(locale, "Could not start the email change"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-sm space-y-2">
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="settings-email">{t(locale, "Email")}</Label>
          <Input
            id="settings-email"
            name="email"
            type="email"
            defaultValue={email}
            required
            disabled={unavailable || pending}
          />
        </div>
        <BusyButton
          type="submit"
          variant="outline"
          busy={pending}
          disabled={unavailable}
          busyLabel={t(locale, "Saving…")}
        >
          {t(locale, "Change")}
        </BusyButton>
      </form>
      {unavailable ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t(
            locale,
            "Email changes require email delivery. Please contact the site administrator.",
          )}
        </p>
      ) : null}
    </div>
  );
}
