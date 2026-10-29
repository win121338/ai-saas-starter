"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export function NavigationFeedback() {
  const { pending } = useLinkStatus();
  const locale = useLocale();
  if (!pending) return null;
  return (
    <span role="status" className="pointer-events-none absolute right-1 top-1">
      <LoaderCircle className="size-3 animate-spin text-primary" aria-hidden />
      <span className="sr-only">
        {locale === "zh" ? "正在打开页面" : "Opening page"}
      </span>
    </span>
  );
}
