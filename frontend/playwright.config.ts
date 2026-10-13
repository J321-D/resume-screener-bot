import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // The CI Linux runner can starve Firefox rendering/React updates with 5
  // simultaneous browser contexts. Preserve ALL browser/test/assertion
  // coverage while bounding host contention; load belongs to a separate
  // explicitly measured concurrency test rather than functional E2E checks.
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: {
    // CI already builds above this step. Test the immutable production bundle,
    // not Next dev hot reload, whose compiler remounts can erase pasted input.
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
