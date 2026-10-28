import "server-only";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditEvents, users } from "@/db/schema";
import { grantCredits } from "./index";
import { adminCreditGrantInput } from "./admin-grant-input";

export class ManualCreditGrantError extends Error {}

/** Called only after the Server Action checks administrator access. */
export async function grantManualCredits(input: unknown, actorUserId: string) {
  const grant = adminCreditGrantInput.parse(input);
  const actor = z.string().min(1).max(200).parse(actorUserId);
  return db.transaction(async (tx) => {
    // Serialize retries, including retries carrying a different recipient or amount.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`admin-grant:${grant.requestId}`}))`,
    );
    const details = JSON.stringify({
      amount: grant.amount,
      reason: grant.reason,
    });
    const [previous] = await tx
      .select()
      .from(adminAuditEvents)
      .where(eq(adminAuditEvents.id, grant.requestId))
      .limit(1);
    if (
      previous &&
      (previous.actorUserId !== actor ||
        previous.action !== "credits.grant" ||
        previous.targetType !== "user" ||
        previous.targetId !== grant.userId ||
        previous.details !== details)
    )
      throw new ManualCreditGrantError(
        "This credit request was already used with different details.",
      );
    const [member] = await tx
      .select({ balance: users.creditBalance })
      .from(users)
      .where(eq(users.id, grant.userId))
      .for("no key update")
      .limit(1);
    if (!member)
      throw new ManualCreditGrantError("This member no longer exists.");
    if (previous) return { amount: grant.amount, balance: member.balance };
    if (member.balance + grant.amount > 2_147_483_647)
      throw new ManualCreditGrantError(
        "This addition would exceed the member's credit balance limit.",
      );
    await grantCredits(
      {
        userId: grant.userId,
        amount: grant.amount,
        type: "admin_adjust",
        ref: { type: "admin_credit_grant", id: grant.requestId },
        idempotencyKey: `admin_grant_${grant.requestId}`,
      },
      tx,
    );
    await tx
      .insert(adminAuditEvents)
      .values({
        id: grant.requestId,
        actorUserId: actor,
        action: "credits.grant",
        targetType: "user",
        targetId: grant.userId,
        details,
      });
    return { amount: grant.amount, balance: member.balance + grant.amount };
  });
}
