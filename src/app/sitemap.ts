import type { MetadataRoute } from "next";

import { artStyles } from "@/config/art-styles";
import { siteConfig } from "@/config/site";

// Public pages only — the (app) group is session-gated and noindexed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/styles",
    ...artStyles.map((style) => `/styles/${style.slug}`),
    "/pricing",
  ].map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
