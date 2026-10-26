import { headers } from "next/headers";

import type { Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  return (await headers()).get("x-artora-locale") === "zh" ? "zh" : "en";
}

export async function getPublicPath(): Promise<string> {
  return (await headers()).get("x-artora-path") ?? "/";
}
