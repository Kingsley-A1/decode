import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: shouldStartLocalServer
    ? {
        command:
          process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
          `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        env: {
          ...process.env,
          APP_URL: process.env.APP_URL ?? baseURL,
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
          AUTH_SECRET:
            process.env.AUTH_SECRET ??
            "playwright-auth-secret-minimum-32-characters",
          NEXTAUTH_SECRET:
            process.env.NEXTAUTH_SECRET ??
            "playwright-auth-secret-minimum-32-characters",
          GOOGLE_CLIENT_ID:
            process.env.GOOGLE_CLIENT_ID ?? "playwright-google-client-id",
          GOOGLE_CLIENT_SECRET:
            process.env.GOOGLE_CLIENT_SECRET ??
            "playwright-google-client-secret",
          GITHUB_ID: process.env.GITHUB_ID ?? "playwright-github-client-id",
          GITHUB_SECRET:
            process.env.GITHUB_SECRET ?? "playwright-github-client-secret",
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
