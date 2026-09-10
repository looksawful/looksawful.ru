import { chromium } from "playwright";
import { runProductionE2E } from "./run-production.mjs";

const rawBaseUrl = process.env.E2E_BASE_URL?.trim() ?? "";
if (!rawBaseUrl) {
  throw new Error("E2E_BASE_URL is required for remote preview verification.");
}

const url = new URL(rawBaseUrl);
if (url.protocol !== "https:") {
  throw new Error(`Remote preview must use HTTPS: ${url.href}`);
}

const baseUrl = url.origin;
const browser = await chromium.launch({ headless: true });

try {
  await runProductionE2E({ browser, baseUrl });
} finally {
  await browser.close();
}
