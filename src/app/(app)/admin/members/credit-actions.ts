"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCreditGrantInput } from "@/lib/credits/admin-grant-input";
import {
  grantManualCredits,
  ManualCreditGrantError,
} from "@/lib/credits/admin-grant";

export type CreditGrantState = {
  ok: boolean;
  error?: string;
  amount?: number;
  balance?: number;
};

export async function addMemberCreditsAction(
  _previous: CreditGrantState,
  form: FormData,
): Promise<CreditGrantState> {
  const session = await requireAdmin();
  const input = adminCreditGrantInput.safeParse({
    requestId: form.get("requestId"),
    userId: form.get("userId"),
    amount: form.get("amount"),
    reason: form.get("reason"),
  });
  if (!input.success)
    return {
      ok: false,
      error:
        "Enter a whole number from 1 to 100,000 and a reason of up to 300 characters.",
    };
  let receipt;
  try {
    receipt = await grantManualCredits(input.data, session.user.id);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ManualCreditGrantError
          ? error.message
          : "Could not confirm the credit addition. Retry this form to check the same request.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, ...receipt };
}
