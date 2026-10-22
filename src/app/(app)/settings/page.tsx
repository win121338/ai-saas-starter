import type { Metadata } from "next";
import { headers } from "next/headers";

import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { DeleteAccount } from "@/components/settings/delete-account";
import { EmailForm } from "@/components/settings/email-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth/session";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });

  const linkedProviders = accounts
    .map((account) => account.providerId)
    .filter((id) => id !== "credential");
  const hasPassword = accounts.some(
    (account) => account.providerId === "credential",
  );
  const availableProviders = [
    ...(features.googleOAuth ? (["google"] as const) : []),
    ...(features.githubOAuth ? (["github"] as const) : []),
  ];

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <PageHeader eyebrow="Account" title="Settings" />

      <Card className="max-w-2xl border border-border bg-card pt-0 shadow-none">
        <CardHeader className="border-b border-border py-5">
          <p className="eyebrow">Profile</p>
          <CardTitle>Name and email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm name={session.user.name} />
          <EmailForm email={session.user.email} canSendEmail={features.email} />
        </CardContent>
      </Card>

      {hasPassword ? (
        <Card className="max-w-2xl border border-border bg-card pt-0 shadow-none">
          <CardHeader className="border-b border-border py-5">
            <p className="eyebrow">Security</p>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      ) : null}

      <Card className="max-w-2xl border border-border bg-card pt-0 shadow-none">
        <CardHeader className="border-b border-border py-5">
          <p className="eyebrow">Sign-in methods</p>
          <CardTitle>Connected accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectedAccounts
            available={availableProviders}
            linked={linkedProviders}
            hasPassword={hasPassword}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl border border-destructive/70 bg-card shadow-none">
        <CardHeader>
          <p className="eyebrow">Danger zone</p>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccount
            hasPassword={hasPassword}
            canSendEmail={features.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
