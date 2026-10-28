"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addMemberCreditsAction } from "@/app/(app)/admin/members/credit-actions";
import { MAX_MANUAL_CREDITS } from "@/lib/credits/admin-grant-input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

type Props = {
  userId: string;
  email: string;
  balance: number;
  initialRequestId: string;
  locale: Locale;
};

function GrantForm({
  userId,
  email,
  balance,
  requestId,
  locale,
  onSuccess,
}: Omit<Props, "initialRequestId"> & {
  requestId: string;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(addMemberCreditsAction, {
    ok: false,
  });
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);
  return (
    <>
      <DialogTitle className="font-heading text-xl font-bold">
        {t(locale, "Add credits")}
      </DialogTitle>
      <DialogDescription className="break-all text-sm">
        {email}
      </DialogDescription>
      {state.ok ? (
        <div className="space-y-4">
          <p role="status" className="text-sm text-primary">
            {t(locale, "Credits added")}: +{state.amount} ·{" "}
            {t(locale, "Current balance")}: {state.balance}
          </p>
          <DialogClose asChild>
            <button type="button" className="artora-action w-full">
              {t(locale, "Done")}
            </button>
          </DialogClose>
        </div>
      ) : (
        <form action={action} className="space-y-5">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="requestId" value={requestId} />
          <p className="text-sm text-muted-foreground">
            {t(locale, "Current balance")}: {balance}
          </p>
          <label className="block text-sm font-semibold">
            {t(locale, "Credits to add")}
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={MAX_MANUAL_CREDITS}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={pending}
              className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
            />
          </label>
          <label className="block text-sm font-semibold">
            {t(locale, "Addition reason")}
            <textarea
              name="reason"
              required
              maxLength={300}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              placeholder={t(
                locale,
                "For example: testing credits or customer support compensation",
              )}
              className="mt-2 w-full resize-y rounded-xl border border-border bg-secondary px-4 py-3 text-sm"
            />
          </label>
          {state.error ? (
            <p role="alert" className="text-sm text-debit-text">
              {t(locale, state.error)}
            </p>
          ) : null}
          <p className="text-xs leading-6 text-muted-foreground">
            {t(
              locale,
              "The addition and its reason will be recorded in the credit ledger and administrator audit log.",
            )}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="artora-action w-full disabled:opacity-50"
          >
            {t(locale, pending ? "Adding credits…" : "Confirm addition")}
          </button>
        </form>
      )}
    </>
  );
}

export function MemberCreditGrant(props: Props) {
  const router = useRouter();
  const [requestId, setRequestId] = useState(props.initialRequestId);
  const [completed, setCompleted] = useState(false);
  const onSuccess = useCallback(() => {
    setCompleted(true);
    router.refresh();
  }, [router]);
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && completed) {
          setRequestId(crypto.randomUUID());
          setCompleted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${t(props.locale, "Add credits")}: ${props.email}`}
          className="artora-quiet-action gap-1 whitespace-nowrap px-3 py-2 text-xs"
        >
          <Plus className="size-3.5" aria-hidden />
          {t(props.locale, "Add credits")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-none sm:max-w-md">
        <GrantForm
          key={requestId}
          {...props}
          requestId={requestId}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
