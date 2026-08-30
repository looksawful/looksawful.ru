import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

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

async function clearHover(page) {
  const viewport = page.viewportSize();
  await page.mouse.move(Math.max(1, viewport.width - 2), 1);
  await page.waitForTimeout(40);
}

async function captureHoverPair(page, locator, outputDir, stem) {
  if (!(await locator.count())) return;

  await locator.scrollIntoViewIfNeeded();
  await clearHover(page);
  await page.waitForTimeout(80);
  await captureLocator(page, locator, `${outputDir}/${stem}-rest.png`);
  await locator.hover({ force: true });
  await page.waitForTimeout(80);
  await captureLocator(page, locator, `${outputDir}/${stem}-active.png`);
}

async function captureDesktop(browser, baseUrl, outputDir) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await freezeMotion(page);
  await page.waitForTimeout(250);

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, summary, `${outputDir}/desktop-summary.png`);
  }

  const overlay = page
    .locator(
      'figure.media[data-caption-view="overlay"]:visible:has(> .media__caption .media__text)',
    )
    .first();
  await captureHoverPair(page, overlay, outputDir, "desktop-overlay");

  const railOverlay = page
    .locator(
      ':is(.media-group[data-layout="strip"], .media-group[data-layout="grid"][data-overflow="reel"]) > .media-group__items > figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)',
    )
    .first();
  await captureHoverPair(page, railOverlay, outputDir, "desktop-rail-overlay");

  const brandOverlay = page
    .locator('.brand-system__item:visible:has(.brand-system__hover-copy)')
    .first();
  await captureHoverPair(page, brandOverlay, outputDir, "desktop-brand-system-overlay");

  const jesteiOverlay = page
    .locator('.jestei-captioned-media:visible:has(.jestei-media__hover-copy)')
    .first();
  await captureHoverPair(page, jesteiOverlay, outputDir, "desktop-jestei-overlay");

  const source = page
    .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
    .first();
  if (await source.count()) {
    await source.click({ force: true });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${outputDir}/desktop-lightbox.png` });
  }

  await context.close();
}

async function captureMobile(browser, baseUrl, outputDir) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await freezeMotion(page);
  await page.waitForTimeout(250);

  const overlay = page
    .locator('figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)')
    .first();
  if (await overlay.count()) {
    await overlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, overlay, `${outputDir}/mobile-overlay-fallback.png`);
  }

  const railOverlay = page
    .locator(
      ':is(.media-group[data-layout="strip"], .media-group[data-layout="grid"][data-overflow="reel"]) > .media-group__items > figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)',
    )
    .first();
  if (await railOverlay.count()) {
    await railOverlay.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, railOverlay, `${outputDir}/mobile-rail-overlay-fallback.png`);
  }

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(page, summary, `${outputDir}/mobile-summary.png`);
  }

  const source = page
    .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
    .first();
  if (await source.count()) {
    await source.tap({ force: true });
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${outputDir}/mobile-lightbox.png` });
  }

  await context.close();
}

export async function captureCaptionQa({
  browser,
  baseUrl,
  outputDir = "artifacts/caption-qa",
}) {
  const absoluteOutputDir = resolve(outputDir);
  await mkdir(absoluteOutputDir, { recursive: true });
  await captureDesktop(browser, baseUrl, absoluteOutputDir);
  await captureMobile(browser, baseUrl, absoluteOutputDir);
  console.log(`Caption QA screenshots written to ${absoluteOutputDir}`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => captureCaptionQa({ browser, baseUrl }));
}
