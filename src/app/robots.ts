import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/generate",
        "/billing",
        "/settings",
        "/creations",
        "/admin",
        "/zh/dashboard",
        "/zh/generate",
        "/zh/creations",
        "/zh/billing",
        "/zh/settings",
        "/zh/admin",
        "/styleguide",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
