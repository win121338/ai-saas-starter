import { z } from "zod";

export const MAX_MANUAL_CREDITS = 100_000;
export const adminCreditGrantInput = z.strictObject({
  requestId: z.uuid(),
  userId: z.string().trim().min(1).max(200),
  amount: z.coerce.number().int().min(1).max(MAX_MANUAL_CREDITS),
  reason: z.string().trim().min(1).max(300),
});

export type AdminCreditGrantInput = z.infer<typeof adminCreditGrantInput>;
