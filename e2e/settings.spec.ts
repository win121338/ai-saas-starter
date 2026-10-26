import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { PASSWORD, signUp, uniqueEmail } from "./helpers";
import { BASE_URL } from "../playwright.config";

test("email change persists and the new address can sign in", async ({
  page,
}) => {
  const original = uniqueEmail("email-before");
  const changed = uniqueEmail("email-after");
  await signUp(page, original);
  await page.goto("/settings");
  await page.getByLabel("Email", { exact: true }).fill(changed);
  await page.getByRole("button", { name: "Change", exact: true }).click();
  await expect(page.getByText("Email updated", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(changed);
  await page.request.post("/api/auth/sign-out", {
    headers: { origin: BASE_URL },
  });
  const oldLogin = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email: original, password: PASSWORD },
  });
  expect(oldLogin.ok()).toBe(false);
  const newLogin = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email: changed, password: PASSWORD },
  });
  expect(newLogin.ok()).toBe(true);
});

test("recovery reports missing email delivery without claiming to send", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("status")).toContainText(
    "configure email delivery",
  );
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeDisabled();
  const request = await page.request.post("/api/auth/request-password-reset", {
    data: { email: uniqueEmail("reset"), redirectTo: "/reset-password" },
  });
  expect(request.ok()).toBe(false);
  expect(await request.json()).toMatchObject({
    code: "RESET_PASSWORD_DISABLED",
  });
});

test("deletion rejects a wrong password and removes the account with the correct one", async ({
  page,
}) => {
  const email = uniqueEmail("delete");
  await signUp(page, email);
  await page.goto("/generate");
  const style = page.getByRole("button", { name: /Watercolor/ });
  await style.click();
  await expect(style).toBeHidden();
  const png = await sharp({
    create: { width: 320, height: 240, channels: 3, background: "#6699aa" },
  })
    .png()
    .toBuffer();
  await page.locator("#studio-photo").setInputFiles({
    name: "delete-test.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByRole("button", { name: "Create for 1 credit" }).click();
  await expect(page.getByAltText("Finished artwork")).toBeVisible({
    timeout: 30_000,
  });
  const imageUrl = await page
    .getByAltText("Finished artwork")
    .getAttribute("src");
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Password", { exact: true }).fill("wrong-password");
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(
    page.getByText("Invalid password", { exact: true }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await dialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    await (await page.request.get("/api/auth/get-session")).json(),
  ).toBeNull();
  expect((await page.request.get(imageUrl!)).ok()).toBe(false);
  const login = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: BASE_URL },
    data: { email, password: PASSWORD },
  });
  expect(login.ok()).toBe(false);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login/);
});
