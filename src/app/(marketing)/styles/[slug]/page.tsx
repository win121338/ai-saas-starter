import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Image as ImageIcon } from "lucide-react";

import { artStyles, getArtStyle } from "@/config/art-styles";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return artStyles.map((style) => ({ slug: style.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const style = getArtStyle((await params).slug);
  if (!style) return {};
  return { title: style.name, description: style.detail };
}

export default async function StyleDetailPage({ params }: PageProps) {
  const style = getArtStyle((await params).slug);
  if (!style) notFound();

  return (
    <div className="artora-shell">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-10 md:px-6 md:pt-16">
        <Link
          href="/styles"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All styles
        </Link>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {style.category} / Art style
            </p>
            <h1 className="mt-4 font-heading text-[clamp(3rem,5vw,4.75rem)] font-extrabold tracking-[-0.045em]">
              {style.name}
            </h1>
            <p className="mt-6 max-w-[550px] text-lg leading-8 text-muted-foreground">
              {style.detail}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/generate?style=${encodeURIComponent(style.slug)}`}
                className="artora-action"
              >
                Try this style <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/styles" className="artora-quiet-action">
                Browse others
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              The studio uses a labeled demo result until the live image API is connected.
            </p>
          </div>
          <div
            className="artora-style-art aspect-[4/3] overflow-hidden rounded-[24px] border border-border"
            data-accent={style.accent}
          >
            <div className="relative z-10 flex flex-col items-center rounded-xl border border-white/15 bg-black/20 px-7 py-6 text-center backdrop-blur-sm">
              <ImageIcon
                className="size-9 text-primary"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="mt-4 font-semibold">Example artwork is coming</p>
              <p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">
                This space is reserved for a real result made with a curated
                prompt.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-20 grid gap-5 border-t border-border pt-10 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              A thoughtful starting point
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold">
              Your image leads.
            </h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            The studio will use your photo and the creative direction behind
            this style. Each preset will be tested with different subjects
            before release.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            Final examples, supported subjects, and guidance will be added after
            the prompt and model are ready.
          </p>
        </div>
      </div>
    </div>
  );
}
