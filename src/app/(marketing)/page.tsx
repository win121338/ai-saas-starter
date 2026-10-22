import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ImagePlus,
  Palette,
  Sparkles,
} from "lucide-react";

import { StyleCard } from "@/components/marketing/style-card";
import { artStyles } from "@/config/art-styles";

const steps = [
  {
    number: "01",
    icon: ImagePlus,
    title: "Bring a photo",
    copy: "Start with a portrait, a pet, or a moment you want to remember.",
  },
  {
    number: "02",
    icon: Palette,
    title: "Find your style",
    copy: "Choose the artistic direction that feels right for your photo.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Make it yours",
    copy: "Our studio will bring the two together in a new work of art.",
  },
] as const;

export default function Home() {
  return (
    <div className="artora-shell overflow-hidden">
      <section className="relative mx-auto max-w-[1200px] px-5 pb-20 pt-20 md:px-6 md:pb-28 md:pt-28">
        <div
          aria-hidden
          className="artora-grid pointer-events-none absolute inset-0"
        />
        <div className="relative z-10 mx-auto max-w-[850px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden /> An art studio for your
            photos
          </span>
          <h1 className="mt-8 font-heading text-[clamp(3rem,6.3vw,5.25rem)] font-extrabold leading-[1.05] tracking-[-0.05em]">
            Your photo.{" "}
            <span className="text-primary">A new point of view.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[650px] text-lg leading-8 text-muted-foreground md:text-xl">
            Explore thoughtful art styles for the images that matter to you.
            Pick a direction, then make the moment your own.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/generate" className="artora-action px-6">
              Open the studio <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/styles" className="artora-quiet-action px-6">
              Explore styles
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Private studio workflow · Live image API testing is in progress
          </p>
        </div>
        <div className="relative mx-auto mt-16 grid max-w-[940px] gap-3 md:grid-cols-[1fr_1.2fr_1fr] md:items-center">
          <div className="artora-surface flex aspect-[4/3] items-center justify-center p-7 md:rotate-[-4deg]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 text-center">
              <ImagePlus
                className="size-8 text-primary"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="mt-4 font-semibold">Your photo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start with a moment
              </p>
            </div>
          </div>
          <div className="artora-surface relative flex aspect-[4/3] items-center justify-center overflow-hidden border-primary/30 bg-[radial-gradient(circle_at_50%_45%,#493126,#151922_63%)] p-7 shadow-[0_28px_90px_rgba(0,0,0,.28)]">
            <div
              className="absolute inset-6 rounded-2xl border border-white/10 rotate-[-5deg]"
              aria-hidden
            />
            <div
              className="absolute inset-6 rounded-2xl border border-white/10 rotate-[5deg]"
              aria-hidden
            />
            <div className="relative rounded-xl border border-primary/25 bg-background/80 px-6 py-5 text-center backdrop-blur-sm">
              <Sparkles
                className="mx-auto size-7 text-primary"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="mt-3 font-heading text-lg font-bold">
                Your art, your way
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Final examples curated by you
              </p>
            </div>
          </div>
          <div className="artora-surface flex aspect-[4/3] items-center justify-center p-7 md:rotate-[4deg]">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 text-center">
              <Palette
                className="size-8 text-primary"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="mt-4 font-semibold">Your style</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a direction
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="styles"
        className="border-t border-border bg-[#10141b] py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1200px] px-5 md:px-6">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Explore the possibilities
              </p>
              <h2 className="mt-3 max-w-[680px] font-heading text-[clamp(2.2rem,4vw,3.25rem)] font-extrabold tracking-[-0.035em]">
                A style for every story.
              </h2>
              <p className="mt-4 max-w-[600px] leading-7 text-muted-foreground">
                Begin with a direction. The final artwork examples will be
                curated from the studio&apos;s own results.
              </p>
            </div>
            <Link
              href="/styles"
              className="inline-flex items-center gap-2 font-semibold text-primary hover:text-[#ffbd7a]"
            >
              All styles <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artStyles.map((style, index) => (
              <StyleCard key={style.slug} style={style} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-[1200px] px-5 py-20 md:px-6 md:py-28"
      >
        <div className="max-w-[650px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-heading text-[clamp(2.2rem,4vw,3.25rem)] font-extrabold tracking-[-0.035em]">
            Your next favorite piece starts here.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="artora-surface p-7">
              <div className="flex items-center justify-between text-primary">
                <step.icon className="size-7" strokeWidth={1.5} aria-hidden />
                <span className="font-mono text-xs">{step.number}</span>
              </div>
              <h3 className="mt-9 font-heading text-xl font-bold">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-[#11151d] py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-7 px-5 md:flex-row md:items-center md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Simple by design
            </p>
            <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.035em]">
              Art should feel personal.
            </h2>
            <p className="mt-3 max-w-[580px] leading-7 text-muted-foreground">
              The best result starts with the right style and a carefully made
              creative direction. We are building the studio around that idea.
            </p>
          </div>
          <Link href="/pricing" className="artora-quiet-action shrink-0">
            See pricing plans <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 py-20 md:px-6 md:py-28">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Questions
        </p>
        <h2 className="mt-3 text-center font-heading text-[clamp(2.2rem,4vw,3.25rem)] font-extrabold tracking-[-0.035em]">
          Good to know.
        </h2>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card px-6">
          <details className="group py-5">
            <summary className="cursor-pointer font-semibold">
              Can I try the studio now?
            </summary>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-muted-foreground">
              You can upload a photo and try the full private workflow. The current result is a clearly marked local demo until the live image API is tested.
            </p>
          </details>
          <details className="group py-5">
            <summary className="cursor-pointer font-semibold">
              Which photos work best?
            </summary>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-muted-foreground">
              Clear photos with a visible subject are a good starting point. We
              will publish tested guidance with the real styles.
            </p>
          </details>
          <details className="group py-5">
            <summary className="cursor-pointer font-semibold">
              When will plans be available?
            </summary>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-muted-foreground">
              Plan details will be published after generation costs and checkout
              have been verified.
            </p>
          </details>
        </div>
      </section>

      <section className="border-t border-border bg-[radial-gradient(circle_at_50%_100%,#38251d,#11151d_65%)] px-5 py-20 text-center md:py-24">
        <h2 className="font-heading text-[clamp(2.3rem,5vw,4rem)] font-extrabold tracking-[-0.04em]">
          See your photos differently.
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] leading-7 text-muted-foreground">
          Pick a style today. Bring your best ideas when the studio is ready.
        </p>
        <Link href="/generate" className="artora-action mt-8">
          Open the studio <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
