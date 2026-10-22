"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Images, LayoutDashboard, Palette, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/generate", label: "Studio", icon: Palette },
  { href: "/creations", label: "Creations", icon: Images },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Workspace navigation"
      className={
        mobile ? "flex gap-1 overflow-x-auto" : "flex flex-col gap-1.5"
      }
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/generate" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
              active
                ? "border border-primary/30 bg-primary/10 text-primary"
                : "border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
