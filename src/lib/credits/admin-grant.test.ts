import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { db } from "@/db";
import { adminAuditEvents, users } from "@/db/schema";
import { closeDb, ensureTestDatabase } from "@/test/db";
import { grantManualCredits } from "./admin-grant";
import { getBalance, getHistory, grantCredits, spendCredits } from "./index";

beforeAll(ensureTestDatabase, 60000);
afterAll(closeDb);

async function member() {
  const id = `manual-credit-${randomUUID()}`;
  await db
    .insert(users)
    .values({ id, email: `${id}@test.local`, name: "Credit test" });
  return id;
}
const request = (userId: string) => ({
  requestId: randomUUID(),
  userId,
  amount: 25,
  reason: "  Testing replenishment  ",
});
async function audits(requestId: string) {
  return db
    .select()
    .from(adminAuditEvents)
    .where(eq(adminAuditEvents.id, requestId));
}
async function invariant(userId: string) {
  const rows = await getHistory(userId, 100);
  expect(await getBalance(userId)).toBe(
    rows.reduce((sum, row) => sum + row.amount, 0),
  );
}

describe("audited manual credit grants", () => {
  it("adds an admin adjustment and an audit record atomically", async () => {
    const userId = await member();
    const input = request(userId);
    const actor = await member();
    expect(await grantManualCredits(input, actor)).toEqual({
      amount: 25,
      balance: 25,
    });
    expect(await getHistory(userId)).toMatchObject([
      {
        type: "admin_adjust",
        amount: 25,
        refType: "admin_credit_grant",
        refId: input.requestId,
        idempotencyKey: `admin_grant_${input.requestId}`,
      },
    ]);
    expect(await audits(input.requestId)).toMatchObject([
      {
        actorUserId: actor,
        action: "credits.grant",
        targetType: "user",
        targetId: userId,
        details: JSON.stringify({
          amount: 25,
          reason: "Testing replenishment",
        }),
      },
    ]);
    await invariant(userId);
  });
  it("grants only once for concurrent duplicate submissions and later retries", async () => {
    const userId = await member();
    const input = request(userId);
    const actor = await member();
    const receipts = await Promise.all(
      Array.from({ length: 5 }, () => grantManualCredits(input, actor)),
    );
    expect(receipts.every((item) => item.balance === 25)).toBe(true);
    await grantManualCredits(input, actor);
    expect(await getHistory(userId)).toHaveLength(1);
    expect(await audits(input.requestId)).toHaveLength(1);
    await invariant(userId);
  });
  it("rejects reusing a request for another amount, recipient, reason or administrator", async () => {
    const userId = await member();
    const other = await member();
    const actor = await member();
    const input = request(userId);
    await grantManualCredits(input, actor);
    for (const changed of [
      { ...input, amount: 26 },
      { ...input, userId: other },
      { ...input, reason: "Another reason" },
    ])
      await expect(grantManualCredits(changed, actor)).rejects.toThrow(
        "different details",
      );
    await expect(grantManualCredits(input, other)).rejects.toThrow(
      "different details",
    );
    expect(await getBalance(userId)).toBe(25);
    expect(await getBalance(other)).toBe(0);
    expect(await audits(input.requestId)).toHaveLength(1);
    await invariant(userId);
  });
  it.each([
    0,
    -1,
    1.5,
    100001,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "",
    "1.1",
  ])("rejects invalid quantity %s before database work", async (amount) => {
    await expect(
      grantManualCredits({ ...request("not-a-member"), amount }, "actor"),
    ).rejects.toThrow();
  });
  it("requires a reason and a valid request identifier", async () => {
    for (const changed of [
      { reason: "  " },
      { reason: "a".repeat(301) },
      { requestId: "invalid" },
    ])
      await expect(
        grantManualCredits({ ...request("not-a-member"), ...changed }, "actor"),
      ).rejects.toThrow();
  });
  it("preserves the balance when manual additions and generation spends happen concurrently", async () => {
    const userId = await member();
    await grantCredits({
      userId,
      amount: 100,
      type: "topup",
      idempotencyKey: `concurrent-seed-${userId}`,
    });
    await Promise.all([
      ...Array.from({ length: 5 }, () =>
        grantManualCredits(request(userId), "actor"),
      ),
      ...Array.from({ length: 5 }, () =>
        spendCredits({
          userId,
          amount: 10,
          ref: { type: "art_job", id: randomUUID() },
        }),
      ),
    ]);
    expect(await getBalance(userId)).toBe(175);
    expect(await getHistory(userId, 100)).toHaveLength(11);
    await invariant(userId);
  });
  it("does not create an audit or grant for a missing recipient", async () => {
    const input = request(`missing-${randomUUID()}`);
    await expect(grantManualCredits(input, "actor")).rejects.toThrow(
      "no longer exists",
    );
    expect(await audits(input.requestId)).toHaveLength(0);
    expect(await getHistory(input.userId)).toHaveLength(0);
  });
  it("prevents balance overflow without appending a partial adjustment", async () => {
    const userId = await member();
    await grantCredits({
      userId,
      amount: 2147483640,
      type: "admin_adjust",
      idempotencyKey: `test-seed-${userId}`,
    });
    const input = request(userId);
    await expect(grantManualCredits(input, "actor")).rejects.toThrow(
      "balance limit",
    );
    expect(await getHistory(userId)).toHaveLength(1);
    expect(await audits(input.requestId)).toHaveLength(0);
    await invariant(userId);
  });
  it("rolls back the ledger and balance if the surrounding audited transaction fails", async () => {
    const userId = await member();
    const id = randomUUID();
    await expect(
      db.transaction(async (tx) => {
        await grantCredits(
          {
            userId,
            amount: 25,
            type: "admin_adjust",
            idempotencyKey: `test-rollback-${id}`,
          },
          tx,
        );
        await tx.insert(adminAuditEvents).values({
          id,
          actorUserId: "actor",
          action: "credits.grant",
          targetType: "user",
          targetId: userId,
        });
        throw new Error("audit transaction failed");
      }),
    ).rejects.toThrow("audit transaction failed");
    expect(await getHistory(userId)).toHaveLength(0);
    expect(await audits(id)).toHaveLength(0);
    await invariant(userId);
  });
});
