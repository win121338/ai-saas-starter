import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/auth";
import { localizedHref } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";
import { getLocale } from "@/lib/i18n-server";

const sections = [
  ["/admin", "Overview"],
  ["/admin/members", "Members"],
  ["/admin/orders", "Orders"],
  ["/admin/jobs", "Image jobs"],
  ["/admin/templates", "Templates"],
  ["/admin/settings", "System settings"],
  ["/admin/audit", "Audit log"],
] as const;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  const locale = await getLocale();
  return (
    <div className="mx-auto max-w-[1320px] space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t(locale, "Operations")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold">
          {t(locale, "Admin console")}
        </h1>
      </div>
      <nav
        aria-label={t(locale, "Admin navigation")}
        className="flex flex-wrap gap-2"
      >
        {sections.map(([href, label]) => (
          <Link
            key={href}
            href={localizedHref(href, locale)}
            className="artora-quiet-action min-h-9 px-3 text-xs"
          >
            {t(locale, label)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
