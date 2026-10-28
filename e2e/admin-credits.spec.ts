import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { BASE_URL, E2E_DATABASE_URL } from "../playwright.config";
import { creditBalance, signUp, uniqueEmail } from "./helpers";

test("an administrator adds credits with a reason and can intentionally grant again", async ({
  page,
  browser,
}, testInfo) => {
  // Two accounts and several protected routes need cold dev compilation on Windows.
  test.setTimeout(360_000);
  const memberEmail = uniqueEmail("manual-credit-member");
  await signUp(page, memberEmail);
  await page.goto("/zh/dashboard");
  await expect(creditBalance(page)).toHaveText("10");
  expect((await page.goto("/zh/admin/members"))?.status()).toBe(404);
  const adminContext = await browser.newContext({ baseURL: BASE_URL });
  const admin = await adminContext.newPage();
  const pool = new Pool({ connectionString: E2E_DATABASE_URL, max: 1 });
  try {
    const adminEmail = uniqueEmail("manual-credit-admin");
    await signUp(admin, adminEmail);
    const operator = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email=$1",
      [adminEmail],
    );
    const member = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email=$1",
      [memberEmail],
    );
    await pool.query(
      "INSERT INTO admin_members (user_id,role) VALUES ($1,'admin')",
      [operator.rows[0].id],
    );
    await admin.goto(`/zh/admin/members?q=${encodeURIComponent(memberEmail)}`);
    const row = admin.getByRole("row").filter({ hasText: memberEmail });
    const open = row.getByRole("button", {
      name: `添加积分: ${memberEmail}`,
      exact: true,
    });
    await open.click();
    const dialog = admin.getByRole("dialog");
    await expect(dialog).toContainText(memberEmail);
    const firstRequest = await dialog
      .locator('input[name="requestId"]')
      .inputValue();
    await dialog.getByLabel("添加数量", { exact: true }).fill("40");
    await dialog.getByLabel("添加原因", { exact: true }).fill("人工测试补充");
    await dialog.getByRole("button", { name: "确认添加", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("+40");
    await expect(dialog.getByRole("status")).toContainText("50");
    await admin.screenshot({
      path: testInfo.outputPath("admin-credit-receipt.png"),
    });
    await dialog.getByRole("button", { name: "完成", exact: true }).click();
    await expect(row.locator("td").nth(3)).toHaveText("50");
    await expect(open).toBeFocused();
    await admin.setViewportSize({ width: 390, height: 844 });
    await open.click();
    expect(
      await dialog.locator('input[name="requestId"]').inputValue(),
    ).not.toBe(firstRequest);
    await dialog.getByLabel("添加数量", { exact: true }).fill("7");
    await dialog.getByLabel("添加原因", { exact: true }).fill("第二次补充");
    const bounds = await dialog.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.height).toBeLessThanOrEqual(844);
    await admin.screenshot({
      path: testInfo.outputPath("admin-credit-mobile.png"),
    });
    await dialog.getByRole("button", { name: "确认添加", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("57");
    await dialog.getByRole("button", { name: "完成", exact: true }).click();
    await expect(row.locator("td").nth(3)).toHaveText("57");
    await page.goto("/zh/dashboard");
    await expect(creditBalance(page)).toHaveText("57");
    const events = await pool.query<{ details: string; actor_user_id: string }>(
      "SELECT details,actor_user_id FROM admin_audit_events WHERE action='credits.grant' AND target_id=$1",
      [member.rows[0].id],
    );
    expect(events.rows).toHaveLength(2);
    expect(
      events.rows.every((event) => event.actor_user_id === operator.rows[0].id),
    ).toBe(true);
    expect(
      events.rows
        .map((event) => JSON.parse(event.details).amount)
        .sort((a, b) => a - b),
    ).toEqual([7, 40]);
    await admin.goto("/zh/admin/audit");
    await expect(
      admin.getByRole("row").filter({ hasText: "人工测试补充" }),
    ).toBeVisible();
    await expect(
      admin.getByRole("row").filter({ hasText: "第二次补充" }),
    ).toBeVisible();
  } finally {
    await pool.end();
    await adminContext.close();
  }
});
