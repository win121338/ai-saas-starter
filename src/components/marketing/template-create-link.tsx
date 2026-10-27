import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localizedHref, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n-copy";

export function TemplateCreateLink({
  slug,
  locale,
}: {
  slug: string | null | undefined;
  locale: Locale;
}) {
  return slug ? (
    <Link
      href={localizedHref(`/generate?style=${slug}`, locale)}
      className="artora-action text-sm"
    >
      {t(locale, "Create with this template")}
      <ArrowUpRight className="size-4" aria-hidden />
    </Link>
  ) : (
    <span className="text-xs text-muted-foreground">
      {t(locale, "This template is not accepting new creations.")}
    </span>
  );
}
