import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getCaseCatalog } from "@/lib/cases/catalog";
import { artworkHref } from "@/lib/cases/types";

// Public pages only — the (app) group is session-gated and noindexed.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { templates } = await getCaseCatalog();
  const paths = [
    "/",
    "/styles",
    ...templates.flatMap((template) => [
      `/styles/${template.id}`,
      ...template.cases.map(artworkHref),
    ]),
    "/pricing",
  ];
  return paths.flatMap((path) => {
    const zhPath = path === "/" ? "/zh" : `/zh${path}`;
    const enUrl = `${siteConfig.url}${path === "/" ? "" : path}`;
    const zhUrl = `${siteConfig.url}${zhPath}`;
    const alternates = { languages: { en: enUrl, "zh-CN": zhUrl } };
    return [
      {
        url: enUrl,
        changeFrequency: "weekly" as const,
        priority: path === "/" ? 1 : 0.6,
        alternates,
      },
      {
        url: zhUrl,
        changeFrequency: "weekly" as const,
        priority: path === "/" ? 0.7 : 0.5,
        alternates,
      },
    ];
  });
}
