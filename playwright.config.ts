import { randomUUID } from "node:crypto";
process.env.PROTOTYPE_CONTROL_DB ??= `.cache/security-e2e/${randomUUID()}/control.sqlite`;
import { defineConfig, devices } from "@playwright/test";

const channel = process.env.PLAYWRIGHT_CHANNEL;
const openAiNotice = process.env.PLAYWRIGHT_AI_NOTICE === "openai";
if (channel !== undefined && channel !== "msedge") {
  throw new Error(
    "PLAYWRIGHT_CHANNEL must be msedge or unset (bundled Chromium).",
  );
}

export default defineConfig({
  globalSetup: "./tests/e2e/invitation-setup.ts",
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3100" },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: channel ?? "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(channel === "msedge" ? { channel: "msedge" } : {}),
      },
    },
  ],
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      PROTOTYPE_CONTROL_DB: process.env.PROTOTYPE_CONTROL_DB,
      APP_MODE: "mock",
      AI_PROVIDER: openAiNotice ? "openai" : "mock",
      AI_LIVE_APPROVED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
