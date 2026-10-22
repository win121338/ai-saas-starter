import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Same-origin paths only — never redirect to a caller-supplied host.
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Artora account
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in to your creative workspace.
        </p>
      </div>
      <OAuthButtons
        google={features.googleOAuth}
        github={features.githubOAuth}
        next={safeNext}
      />
      <LoginForm magicLink={features.email} next={safeNext} />
      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
