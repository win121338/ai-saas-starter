import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Palette, Sparkles, Wallet } from "lucide-react";

import { LedgerTable, type LedgerEntry } from "@/components/ledger-table";
import { getHistory } from "@/lib/credits";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false },
};

export default async function DashboardPage() {
  const session = await requireSession();
  const history = await getHistory(session.user.id, 8);
  const entries: LedgerEntry[] = history.map((tx) => ({
    id: tx.id,
    timestamp: tx.createdAt.toISOString().slice(0, 16).replace("T", " "),
    type: tx.type,
    ref:
      tx.refType && tx.refId ? `${tx.refType} ${tx.refId.slice(0, 12)}…` : "—",
    amount: tx.amount,
  }));

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Overview
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome to Artora, {session.user.name}.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Choose a style, create a private demo artwork, and revisit it in Creations.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="artora-surface relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,#493126,#141821_60%)] p-7 sm:p-9">
          <Sparkles
            className="size-8 text-primary"
            strokeWidth={1.5}
            aria-hidden
          />
          <h2 className="mt-8 font-heading text-3xl font-bold">
            Your creative space is ready to explore.
          </h2>
          <p className="mt-3 max-w-[520px] text-sm leading-7 text-muted-foreground">
            Upload a photo and choose a style to try the full workflow. Results are clearly marked as local demos until the live image API is tested.
          </p>
          <Link href="/generate" className="artora-action mt-7">
            Open studio <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-5">
          <div className="artora-surface flex items-center gap-5 p-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Current credit balance
              </p>
              <p
                className="mt-1 font-heading text-3xl font-bold"
                data-testid="dashboard-balance"
              >
                {session.user.creditBalance ?? 0}
              </p>
            </div>
          </div>
          <Link
            href="/styles"
            className="artora-surface flex items-center gap-5 p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="size-6" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">Explore styles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Six creative directions
              </p>
            </div>
            <ArrowRight className="ml-auto size-4 text-primary" aria-hidden />
          </Link>
        </div>
      </div>
      <section className="artora-surface overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-heading text-xl font-bold">Credit activity</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Existing starter credits and legacy demo activity appear here.
          </p>
        </div>
        <div className="overflow-x-auto p-4 sm:p-6">
          {entries.length ? (
            <LedgerTable entries={entries} />
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
