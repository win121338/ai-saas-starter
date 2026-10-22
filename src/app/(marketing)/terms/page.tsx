import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms", robots: { index: false } };

export default function TermsPage() {
  return (
    <div className="artora-shell flex-1">
      <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Launch preparation
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold">
          Terms information
        </h1>
        <div className="artora-surface mt-8 space-y-4 p-7 text-sm leading-7 text-muted-foreground">
          <p>
            Artora is currently a working preview. Photo-to-art generation and
            Artora checkout are not available yet.
          </p>
          <p>
            Final service terms, including the operating entity, payment rules,
            refunds, and content rights, will be published before those services
            open.
          </p>
          <p>
            The source project&apos;s MIT license applies to its code. It is
            separate from the terms for a future hosted service.
          </p>
        </div>
      </div>
    </div>
  );
}
