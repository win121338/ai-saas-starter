import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { siteConfig } from "@/config/site";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-[#0e1117]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-heading text-xl font-bold"
          >
            <LogoMark className="size-8" /> {siteConfig.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            A place for the photos you love to become something you can keep.
          </p>
          <p className="mt-7 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Working preview.
          </p>
        </div>
        <nav
          aria-label="Product links"
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="mb-1 font-semibold text-foreground">Explore</p>
          <Link
            href="/styles"
            className="text-muted-foreground hover:text-foreground"
          >
            Styles
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/generate"
            className="text-muted-foreground hover:text-foreground"
          >
            Studio
          </Link>
        </nav>
        <nav
          aria-label="Account and legal links"
          className="flex flex-col items-start gap-3 text-sm"
        >
          <p className="mb-1 font-semibold text-foreground">More</p>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
