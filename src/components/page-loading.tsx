"use client";

import { useLocale } from "@/components/locale-provider";

export function PageLoading() {
  const locale = useLocale();
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto w-full max-w-[1200px] space-y-6 py-8"
    >
      <span className="sr-only">
        {locale === "zh" ? "正在加载页面" : "Loading page"}
      </span>
      <div aria-hidden className="space-y-6 motion-safe:animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-secondary" />
        <div className="h-4 w-2/3 max-w-md rounded bg-secondary" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-64 rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
