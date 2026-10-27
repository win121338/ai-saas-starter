import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Playwright runs a second dev server while the owner's normal dev server
  // may be open; each needs its own build cache and lock file.
  distDir: process.env.PLAYWRIGHT_E2E === "true" ? ".next-e2e" : ".next",
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  // Marketing reads the approved case catalog at render time. Trace only
  // manifests; prompts, original screenshots and review records stay local.
  outputFileTracingIncludes: {
    "/*": [
      "./content/case-templates/catalog.json",
      "./content/case-templates/*/template.json",
    ],
  },
};

export default nextConfig;
