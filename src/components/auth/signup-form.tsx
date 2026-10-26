"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { z } from "zod";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";
import { t } from "@/lib/i18n-copy";

const signupSchema = z.object({
  name: z.string().min(1, "Enter your name").max(100),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function SignupForm({
  requiresVerification,
  next = "/dashboard",
}: {
  requiresVerification: boolean;
  next?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verifyNotice, setVerifyNotice] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(
        t(locale, parsed.error.issues[0]?.message ?? "Check your input"),
      );
      return;
    }
    setPending(true);
    const { error: signUpError } = await authClient.signUp.email({
      ...parsed.data,
      callbackURL: next,
    });
    if (signUpError) {
      const message = signUpError.message ?? "";
      setError(
        /exist|already/i.test(message)
          ? t(locale, "That email already has an account — sign in instead.")
          : /password/i.test(message)
            ? t(
                locale,
                "That password is too easy to guess — use at least 8 characters.",
              )
            : message || t(locale, "Sign-up failed — try again in a moment."),
      );
      setPending(false);
      return;
    }
    if (requiresVerification) {
      setVerifyNotice(true);
      return;
    }
    router.push(next as Parameters<typeof router.push>[0]);
    router.refresh();
  }

  if (verifyNotice) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(
          locale,
          "Almost there — check your inbox and click the verification link to activate your account.",
        )}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="signup-name">{t(locale, "Name")}</Label>
        <Input id="signup-name" name="name" autoComplete="name" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-email">{t(locale, "Email")}</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="signup-password">{t(locale, "Password")}</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {error ? <p className="text-sm text-debit-text">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {t(locale, pending ? "Creating account…" : "Create account")}
      </Button>
    </form>
  );
}
