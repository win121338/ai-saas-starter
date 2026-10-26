"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const parsed = schema.safeParse({
      newPassword: new FormData(event.currentTarget).get("newPassword"),
    });
    if (!parsed.success) {
      setError(
        t(locale, parsed.error.issues[0]?.message ?? "Check your input"),
      );
      return;
    }
    setPending(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: parsed.data.newPassword,
        token,
      });
      if (resetError) {
        setError(
          resetError.code === "INVALID_TOKEN"
            ? t(locale, "The link may have expired — try again")
            : (resetError.message ??
                t(locale, "The link may have expired — try again")),
        );
        return;
      }
      toast.success(t(locale, "Password updated — sign in with the new one"));
      router.push(localizedHref("/login", locale));
    } catch {
      setError(t(locale, "Could not reset your password. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="reset-password">{t(locale, "New password")}</Label>
        <Input
          id="reset-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-debit-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {t(locale, pending ? "Saving…" : "Set new password")}
      </Button>
    </form>
  );
}
