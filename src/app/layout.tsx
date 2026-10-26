import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Martian_Mono,
} from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/components/locale-provider";
import { siteConfig } from "@/config/site";
import { getLocale, getPublicPath } from "@/lib/i18n-server";
import { stripLocale } from "@/lib/i18n";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [locale, publicPath] = await Promise.all([
    getLocale(),
    getPublicPath(),
  ]);
  const path = stripLocale(publicPath);
  const publicPage =
    path === "/" ||
    path === "/styles" ||
    path.startsWith("/styles/") ||
    path === "/pricing";
  const description =
    locale === "zh"
      ? "用精心设计的艺术风格，把你珍爱的照片变成独特作品。"
      : siteConfig.description;
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default:
        locale === "zh"
          ? `${siteConfig.name} — 让照片焕发艺术新意`
          : `${siteConfig.name} — turn your photos into art`,
      template: `%s — ${siteConfig.name}`,
    },
    description,
    robots: publicPage ? undefined : { index: false, follow: false },
    alternates: publicPage
      ? {
          canonical: publicPath,
          languages: { en: path, "zh-CN": path === "/" ? "/zh" : `/zh${path}` },
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: siteConfig.name,
      description,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      alternateLocale: locale === "zh" ? "en_US" : "zh_CN",
    },
    twitter: {
      card: "summary",
      title: siteConfig.name,
      description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0d12",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale === "zh" ? "zh-CN" : "en"}
      className={`${instrumentSans.variable} ${martianMono.variable} ${bricolage.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
