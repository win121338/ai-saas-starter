import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="artora-shell flex min-h-dvh flex-col">
      <header className="flex h-[72px] items-center justify-between border-b border-border px-5 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold"
        >
          <LogoMark className="size-8" /> {siteConfig.name}
        </Link>
        <Link
          href="/styles"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Explore styles
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="artora-surface w-full max-w-[440px] p-7 sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
