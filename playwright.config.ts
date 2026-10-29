import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: process.env.BLOG_TEST_URL || "http://localhost:4322",
    launchOptions: { channel: "chrome" },
  },
  reporter: "list",
  outputDir: "/tmp/fourthwall-browser-results",
});
