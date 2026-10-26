"use client";

import * as React from "react";

import Link from "next/link";
import { toast } from "sonner";

import {
  generateImageAction,
  type GenerateResult,
} from "@/app/(app)/generate/actions";
import { BusyButton } from "@/components/busy-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/locale-provider";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

const initialState: GenerateResult = { ok: true };

const errorMessages: Record<NonNullable<GenerateResult["error"]>, string> = {
  invalid_prompt: "Prompts need 3–1000 characters — one sentence works",
  rate_limited: "Slow down — 10 per minute. Try again in a moment.",
  insufficient_credits:
    "You're out of credits — top up in Billing and try again.",
  generation_failed: "Generation failed — credit refunded",
};

export function GenerateForm({
  balance,
  cost,
  mock,
}: {
  balance: number;
  cost: number;
  /** AI_MOCK is on — surface the "FAIL" failure switch in the placeholder. */
  mock: boolean;
}) {
  const locale = useLocale();
  const formRef = React.useRef<HTMLFormElement>(null);
  // The server action goes to useActionState directly, keeping the form
  // functional before hydration. Every invocation returns a fresh object,
  // so the effect below fires once per submission.
  const [state, formAction, pending] = React.useActionState(
    generateImageAction,
    initialState,
  );

  React.useEffect(() => {
    if (state === initialState) return;
    if (state.error) {
      toast.error(t(locale, errorMessages[state.error]));
      return;
    }
    toast.success(
      locale === "zh"
        ? `图片已生成，消耗 ${cost} 积分。`
        : `Image generated! ${cost} credit spent.`,
    );
    formRef.current?.reset();
  }, [state, cost, locale]);

  const outOfCredits = balance < cost;

  return (
    <form ref={formRef} action={formAction} className="grid max-w-xl gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="generate-prompt">{t(locale, "Prompt")}</Label>
        <Textarea
          id="generate-prompt"
          name="prompt"
          placeholder={
            mock
              ? t(
                  locale,
                  'A ledger book on a desk, studio light — mock mode: "FAIL" in the prompt simulates a provider error and refunds the credit',
                )
              : t(locale, "A ledger book on a desk, studio light")
          }
          minLength={3}
          maxLength={1000}
          required
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-3">
        <BusyButton
          type="submit"
          busy={pending}
          busyLabel={t(locale, "Generating…")}
          disabled={outOfCredits}
        >
          {locale === "zh"
            ? `生成 — ${cost} 积分`
            : `Generate — ${cost} credit`}
        </BusyButton>
        {outOfCredits ? (
          <p className="text-sm text-muted-foreground">
            {t(locale, "You're out of credits —")}{" "}
            <Link href={localizedHref("/billing", locale)} className="link-pop">
              {t(locale, "top up in Billing")}
            </Link>{" "}
            {t(locale, "and the balance updates the moment payment lands.")}
          </p>
        ) : null}
      </div>
    </form>
  );
}
