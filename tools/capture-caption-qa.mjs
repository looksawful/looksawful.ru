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

async function freezeMotion(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function captureLocator(page, locator, path) {
  const box = await locator.boundingBox();
  if (!box || box.width <= 1 || box.height <= 1) return;

  const viewport = page.viewportSize();
  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  const width = Math.min(box.width, Math.max(1, viewport.width - x));
  const height = Math.min(box.height, Math.max(1, viewport.height - y));

  if (width <= 1 || height <= 1) return;
  await page.screenshot({ path, clip: { x, y, width, height } });
}

async function captureDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await freezeMotion(page);
  await page.waitForTimeout(250);

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, summary, `${OUTPUT}/desktop-summary.png`);
  }

  const overlay = page
    .locator('figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)')
    .first();
  if (await overlay.count()) {
    await overlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, overlay, `${OUTPUT}/desktop-overlay-rest.png`);
    await overlay.hover({ force: true });
    await page.waitForTimeout(80);
    await captureLocator(page, overlay, `${OUTPUT}/desktop-overlay-active.png`);
  }

  const source = page
    .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
    .first();
  if (await source.count()) {
    await source.click({ force: true });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${OUTPUT}/desktop-lightbox.png` });
  }

  await context.close();
}

async function captureMobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await freezeMotion(page);
  await page.waitForTimeout(250);

  const overlay = page
    .locator('figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)')
    .first();
  if (await overlay.count()) {
    await overlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, overlay, `${OUTPUT}/mobile-overlay-rest.png`);
    await overlay.tap({ force: true });
    await page.waitForTimeout(80);
    await captureLocator(page, overlay, `${OUTPUT}/mobile-overlay-active.png`);
  }

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, summary, `${OUTPUT}/mobile-summary.png`);
  }

  await context.close();
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
