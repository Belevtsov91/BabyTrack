import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["html", { outputFolder: "test-report", open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:8081",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    // ── Mobile ────────────────────────────────────────────────────────────────
    {
      name: "mobile-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 } },
    },
    {
      name: "mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-430",
      use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } },
    },
    // ── Tablet ────────────────────────────────────────────────────────────────
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "tablet-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 1366 } },
    },
    // ── Desktop ───────────────────────────────────────────────────────────────
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "desktop-1920",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
});
