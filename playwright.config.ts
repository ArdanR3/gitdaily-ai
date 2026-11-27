import fs from "node:fs";
import { defineConfig } from "@playwright/test";

function resolveBrowserExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_USE_BUNDLED === "1") return undefined;
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  ].filter((p): p is string => Boolean(p));

  return candidates.find((p) => fs.existsSync(p));
}

const executablePath = resolveBrowserExecutable();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    headless: true,
    launchOptions: executablePath ? { executablePath } : undefined,
    trace: "off",
    screenshot: "off",
  },
});
