import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 4174;
const BASE_URL = `http://${HOST}:${PORT}`;
const OUTPUT = "artifacts/caption-qa";

await mkdir(OUTPUT, { recursive: true });

const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    HOST,
    "--port",
    String(PORT),
    "--strictPort",
  ],
  { stdio: "ignore" },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error("QA preview did not start");
}

async function captureDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(800);

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await summary.screenshot({ path: `${OUTPUT}/desktop-summary.png` });
  }

  const overlay = page
    .locator('figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)')
    .first();
  if (await overlay.count()) {
    await overlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await overlay.screenshot({ path: `${OUTPUT}/desktop-overlay-rest.png` });
    await overlay.hover({ force: true });
    await page.waitForTimeout(220);
    await overlay.screenshot({ path: `${OUTPUT}/desktop-overlay-active.png` });
  }

  const source = page
    .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
    .first();
  if (await source.count()) {
    await source.click({ force: true });
    await page.waitForTimeout(200);
    const lightbox = page.locator("[data-media-lightbox]");
    if (await lightbox.count()) {
      await lightbox.screenshot({ path: `${OUTPUT}/desktop-lightbox.png` });
    }
  }

  await page.close();
}

async function captureMobile(browser) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(800);

  const overlay = page
    .locator('figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)')
    .first();
  if (await overlay.count()) {
    await overlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await overlay.screenshot({ path: `${OUTPUT}/mobile-overlay-rest.png` });
    await overlay.tap({ force: true });
    await page.waitForTimeout(220);
    await overlay.screenshot({ path: `${OUTPUT}/mobile-overlay-active.png` });
  }

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await summary.screenshot({ path: `${OUTPUT}/mobile-summary.png` });
  }

  await page.close();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await captureDesktop(browser);
  await captureMobile(browser);
  console.log(`Caption QA screenshots written to ${OUTPUT}`);
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
