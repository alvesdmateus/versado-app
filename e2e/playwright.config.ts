import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 390, height: 844 }, // Mobile viewport
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],

  webServer: [
    {
      command: "bun run dev:api",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      cwd: "../",
      timeout: 30_000,
      env: {
        DATABASE_URL:
          "postgresql://postgres:postgres@localhost:5433/versado_test",
        JWT_SECRET: "test-secret-key-that-is-at-least-32-chars-long",
        WEB_URL: "http://localhost:5173",
        NODE_ENV: "test",
        STRIPE_SECRET_KEY: "sk_test_fake",
        STRIPE_WEBHOOK_SECRET: "whsec_test_fake",
        STRIPE_PRODUCT_ID_FLUENT: "prod_test_fake",
        OPENAI_API_KEY: "sk-test-fake",
      },
    },
    {
      command: "bun run dev:web",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      cwd: "../",
      timeout: 30_000,
    },
  ],
});
