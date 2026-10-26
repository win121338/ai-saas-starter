"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { BusyButton } from "@/components/busy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const password = new FormData(event.currentTarget).get("password");
    setPending(true);
    try {
      const { data, error } = await authClient.deleteUser(
        hasPassword && typeof password === "string" && password.length > 0
          ? { password }
          : { callbackURL: localizedHref("/", locale) },
      );
      if (error) {
        toast.error(
          error.code === "SESSION_EXPIRED"
            ? t(locale, "Sign in again before deleting your account.")
            : (error.message ?? t(locale, "Could not delete the account")),
        );
        return;
      }
      if (data?.message === "User deleted") {
        // Deleted immediately. Subscription cancellation runs in beforeDelete (M3).
        router.push(localizedHref("/", locale));
        router.refresh();
        return;
      }
      toast.error(t(locale, "Could not delete the account"));
    } catch {
      toast.error(t(locale, "Could not delete the account"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-muted-foreground">
        {t(
          locale,
          "Deletes your account, generations, and ledger history. Cancels any active subscription. This cannot be undone.",
        )}
      </p>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">{t(locale, "Delete account")}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "Delete this account?")}</DialogTitle>
            <DialogDescription>
              {hasPassword
                ? t(
                    locale,
                    "Confirm with your password. This permanently removes:",
                  )
                : t(
                    locale,
                    "A recent sign-in is required. Confirming permanently removes:",
                  )}
            </DialogDescription>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>— {t(locale, "your account and every sign-in method")}</li>
              <li>— {t(locale, "all generated images")}</li>
              <li>— {t(locale, "the entire credit ledger history")}</li>
              <li>
                —{" "}
                {t(
                  locale,
                  "any active subscription, where billing is configured",
                )}
              </li>
            </ul>
          </DialogHeader>
          <form onSubmit={onDelete} className="grid gap-4">
            {hasPassword ? (
              <div className="grid gap-1.5">
                <Label htmlFor="delete-password">{t(locale, "Password")}</Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
            ) : null}
            <DialogFooter showCloseButton>
              <BusyButton
                type="submit"
                variant="destructive"
                busy={pending}
                busyLabel={t(locale, "Deleting…")}
              >
                {t(locale, "Delete permanently")}
              </BusyButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
