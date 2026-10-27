import { defineConfig, devices } from "@playwright/test";

// Read-only public-page checks against the owner's existing dev server.
// No account fixtures, database setup, model calls or server teardown.
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["landing.spec.ts", "i18n.spec.ts", "case-responsive.spec.ts"],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: "list",
  outputDir: "test-results/public",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
