import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  grant: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/lib/admin/auth", () => ({ requireAdmin: fake.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: fake.refresh }));
vi.mock("@/lib/credits/admin-grant", () => ({
  grantManualCredits: fake.grant,
  ManualCreditGrantError: class extends Error {},
}));
import { addMemberCreditsAction } from "./credit-actions";

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    requestId: randomUUID(),
    userId: "member-1",
    amount: "100",
    reason: "Testing",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  fake.requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
  fake.grant.mockResolvedValue({ amount: 100, balance: 100 });
});
describe("member credit Server Action", () => {
  it("checks administrator access before parsing or writing credits", async () => {
    fake.requireAdmin.mockRejectedValueOnce(new Error("ADMIN_REQUIRED"));
    await expect(
      addMemberCreditsAction({ ok: false }, new FormData()),
    ).rejects.toThrow("ADMIN_REQUIRED");
    expect(fake.grant).not.toHaveBeenCalled();
  });
  it("validates the form and uses the authenticated administrator, not caller metadata", async () => {
    const data = form();
    data.set("actorUserId", "forged-user");
    expect(await addMemberCreditsAction({ ok: false }, data)).toEqual({
      ok: true,
      amount: 100,
      balance: 100,
    });
    expect(fake.grant).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "member-1",
        amount: 100,
        reason: "Testing",
      }),
      "admin-1",
    );
    expect(fake.refresh).toHaveBeenCalledWith("/", "layout");
  });
  it("rejects invalid amounts and missing reasons without touching the ledger", async () => {
    for (const [key, value] of [
      ["amount", "-5"],
      ["amount", "0"],
      ["amount", "1.5"],
      ["reason", "  "],
    ]) {
      const data = form();
      data.set(key, value);
      expect((await addMemberCreditsAction({ ok: false }, data)).ok).toBe(
        false,
      );
    }
    expect(fake.grant).not.toHaveBeenCalled();
  });
  it("keeps uncertain retries on the same request and does not expose database errors", async () => {
    const data = form();
    fake.grant.mockRejectedValueOnce(new Error("private database details"));
    const result = await addMemberCreditsAction({ ok: false }, data);
    expect(result.ok).toBe(false);
    expect(result.error).not.toContain("private database");
    expect((await addMemberCreditsAction({ ok: false }, data)).ok).toBe(true);
    expect(fake.grant.mock.calls[0][0].requestId).toBe(
      fake.grant.mock.calls[1][0].requestId,
    );
  });
});
