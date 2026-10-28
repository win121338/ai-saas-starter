import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Playwright runs a second dev server while the owner's normal dev server
  // may be open; each needs its own build cache and lock file.
  distDir: process.env.PLAYWRIGHT_E2E === "true" ? ".next-e2e" : ".next",
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  // Trace template packages and effective reference WebPs for server workers.
  // Raw manuscripts, screenshots and review records stay out of the bundle.
  outputFileTracingIncludes: {
    "/*": [
      "./content/case-templates/catalog.json",
      "./content/case-templates/*/template.json",
      "./content/case-templates/*/creative-template.json",
      "./content/case-templates/*/references/*.webp",
    ],
  },
};

export default nextConfig;
