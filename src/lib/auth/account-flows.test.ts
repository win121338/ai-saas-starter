import { randomUUID } from "node:crypto";
import { render } from "@react-email/render";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    features: { ...actual.features, email: true, billing: false },
  };
});

import { auth } from "./index";
import { db } from "@/db";
import { verifications } from "@/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { closeDb, ensureTestDatabase } from "@/test/db";

beforeAll(ensureTestDatabase, 60_000);
afterAll(closeDb);

const base = env.BETTER_AUTH_URL;
const password = "test-password-42";

async function request(path: string, body?: object, cookie?: string) {
  return auth.handler(
    new Request(`${base}/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        origin: base,
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}

async function emailUrl(to: string, subject: string) {
  const mail = vi
    .mocked(sendEmail)
    .mock.calls.map(([input]) => input)
    .findLast((input) => input.to === to && input.subject === subject);
  expect(mail).toBeDefined();
  if (mail?.text) return mail.text.match(/https?:\/\/\S+/)![0];
  const html = await render(mail!.react!);
  return html
    .match(/href="([^"]*\/api\/auth\/[^"]*)"/)![1]
    .replaceAll("&amp;", "&");
}

async function verifiedUser() {
  const email = `account-${randomUUID()}@test.local`;
  const signup = await request("sign-up/email", {
    name: "Account Test",
    email,
    password,
  });
  expect(signup.ok).toBe(true);
  const verification = await auth.handler(
    new Request(await emailUrl(email, "Verify your email address")),
  );
  expect(verification.status).toBeLessThan(400);
  const cookie = verification.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  expect(cookie).toContain("session_token=");
  return { email, cookie };
}

describe("account flows with email delivery", () => {
  it("keeps the account usable after delivery failure and allows retry", async () => {
    const { email } = await verifiedUser();
    vi.mocked(sendEmail).mockRejectedValueOnce(
      new Error("Email delivery unavailable"),
    );
    const response = await request("request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    // Better Auth masks delivery failures to keep the reset response generic.
    expect(response.ok).toBe(true);
    expect((await request("sign-in/email", { email, password })).ok).toBe(true);
    const retry = await request("request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    expect(retry.ok).toBe(true);
    const callback = await auth.handler(
      new Request(await emailUrl(email, "Reset your password")),
    );
    expect(
      new URL(callback.headers.get("location")!).searchParams.get("token"),
    ).toBeTruthy();
  });

  it("delivers the reset link, accepts it once, and revokes existing sessions", async () => {
    const { email, cookie } = await verifiedUser();
    expect(
      (
        await request("request-password-reset", {
          email,
          redirectTo: "/reset-password",
        })
      ).ok,
    ).toBe(true);
    const resetLink = await emailUrl(email, "Reset your password");
    const callback = await auth.handler(new Request(resetLink));
    const redirect = new URL(callback.headers.get("location")!);
    expect(redirect.pathname).toBe("/reset-password");
    const token = redirect.searchParams.get("token")!;
    expect(token).toBeTruthy();
    const newPassword = "new-test-password-42";
    expect((await request("reset-password", { token, newPassword })).ok).toBe(
      true,
    );
    expect((await request("reset-password", { token, newPassword })).ok).toBe(
      false,
    );
    expect(
      await (await request("get-session", undefined, cookie)).json(),
    ).toBeNull();
    expect((await request("sign-in/email", { email, password })).ok).toBe(
      false,
    );
    expect(
      (await request("sign-in/email", { email, password: newPassword })).ok,
    ).toBe(true);
  });

  it("rejects an expired password reset token", async () => {
    const { email } = await verifiedUser();
    await request("request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    const link = new URL(await emailUrl(email, "Reset your password"));
    const token = link.pathname.split("/").at(-1)!;
    await db
      .update(verifications)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(verifications.identifier, `reset-password:${token}`));
    expect(
      (
        await request("reset-password", {
          token,
          newPassword: "changed-password-42",
        })
      ).ok,
    ).toBe(false);
  });

  it("requires confirmation of both addresses when changing a verified email", async () => {
    const { email, cookie } = await verifiedUser();
    const newEmail = `changed-${randomUUID()}@test.local`;
    expect(
      (
        await request(
          "change-email",
          { newEmail, callbackURL: "/settings" },
          cookie,
        )
      ).ok,
    ).toBe(true);
    const approval = await auth.handler(
      new Request(await emailUrl(email, "Approve your email change")),
    );
    expect(approval.status).toBeLessThan(400);
    expect(
      (await request("sign-in/email", { email: newEmail, password })).ok,
    ).toBe(false);
    const verified = await auth.handler(
      new Request(await emailUrl(newEmail, "Verify your email address")),
    );
    expect(verified.status).toBeLessThan(400);
    expect(
      (await request("sign-in/email", { email: newEmail, password })).ok,
    ).toBe(true);
    expect((await request("sign-in/email", { email, password })).ok).toBe(
      false,
    );
  });
});
