import Link from "next/link";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { UserMenu } from "@/components/app/user-menu";
import { LogoMark } from "@/components/logo-mark";
import { siteConfig } from "@/config/site";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border bg-[#11151d] md:flex md:flex-col">
        <Link
          href="/"
          className="flex h-[72px] items-center gap-2.5 border-b border-border px-5 font-heading text-xl font-extrabold"
        >
          <LogoMark className="size-8" /> {siteConfig.name}
        </Link>
        <div className="p-3">
          <SidebarNav />
        </div>
        <div className="mt-auto p-5 text-xs leading-6 text-muted-foreground">
          Private photo-to-art workspace
          <br />
          Live image generation is being tested.
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border px-5 sm:px-7">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-lg font-bold md:hidden"
          >
            <LogoMark className="size-7" /> {siteConfig.name}
          </Link>
          <span className="hidden text-sm font-medium text-muted-foreground md:block">
            Your workspace
          </span>
          <div className="ml-auto flex items-center gap-4">
            <div
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm"
              title="Existing starter credit balance"
            >
              <span className="text-muted-foreground">Credits </span>
              <span
                className="font-semibold text-primary"
                data-testid="credit-balance"
              >
                {session.user.creditBalance}
              </span>
            </div>
            <UserMenu name={session.user.name} email={session.user.email} />
          </div>
        </header>
        <div className="border-b border-border px-3 py-2 md:hidden">
          <SidebarNav mobile />
        </div>
        <main className="flex-1 p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
