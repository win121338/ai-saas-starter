import type { Metadata } from "next";
import Link from "next/link";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignupForm } from "@/components/auth/signup-form";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Create account
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          Make space for art.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Save your place in the Artora studio.
        </p>
      </div>
      <OAuthButtons
        google={features.googleOAuth}
        github={features.githubOAuth}
        next={safeNext}
      />
      <SignupForm requiresVerification={features.email} next={safeNext} />
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
