import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { siteConfig } from "@/config/site";

import { MobileMenu } from "./nav-mobile";

const links = [
  { href: "/styles", label: "Styles" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center gap-5 px-5 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-tight"
        >
          <LogoMark className="size-8" />
          {siteConfig.name}
        </Link>
        <nav
          className="ml-auto hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-foreground hover:text-primary sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/generate"
            className="artora-action min-h-10 px-4 text-sm"
          >
            Open studio <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}
