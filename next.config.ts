import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright runs a second dev server while the owner's normal dev server
  // may be open; each needs its own build cache and lock file.
  distDir: process.env.PLAYWRIGHT_E2E === "true" ? ".next-e2e" : ".next",
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  // The landing's code exhibit reads src/lib/credits/index.ts with fs at
  // render time (the auth-aware nav makes marketing pages dynamic). Include
  // the file in the traced output so the read works in production too.
  outputFileTracingIncludes: {
    "/": ["./src/lib/credits/index.ts"],
  },
};

export default nextConfig;
