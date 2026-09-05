import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

const JESTEI_ROUTE = "/work/jestei-pool/";
const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
const MOBILE_VIEWPORTS = [
  { width: 320, height: 760 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 900 },
];

function routeSlug(route) {
  return route.replace(/^\/+|\/+$/g, "").replaceAll("/", "-") || "home";
}

function artifactName(route, viewport, stem) {
  const viewportLabel = viewport ? `${viewport.width}-${stem}` : stem;
  return `${routeSlug(route)}-${viewportLabel}.png`;
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

async function preparePage(page, baseUrl, route) {
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts?.ready);
  await freezeMotion(page);
  await page.waitForTimeout(250);
}

async function captureLocator(page, locator, path) {
  const box = await locator.boundingBox();
  if (!box || box.width <= 1 || box.height <= 1) return false;

  const viewport = page.viewportSize();
  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  const width = Math.min(box.width, Math.max(1, viewport.width - x));
  const height = Math.min(box.height, Math.max(1, viewport.height - y));

  if (width <= 1 || height <= 1) return false;
  await page.screenshot({ path, clip: { x, y, width, height } });
  return true;
}

async function clearHover(page) {
  const viewport = page.viewportSize();
  await page.mouse.move(Math.max(1, viewport.width - 2), 1);
  await page.waitForTimeout(40);
}

async function captureHoverPair(page, locator, outputDir, route, stem) {
  if (!(await locator.count())) return;

  await locator.scrollIntoViewIfNeeded();
  await clearHover(page);
  await page.waitForTimeout(80);
  await captureLocator(
    page,
    locator,
    `${outputDir}/${artifactName(route, null, `${stem}-rest`)}`,
  );
  await locator.hover({ force: true });
  await page.waitForTimeout(80);
  await captureLocator(
    page,
    locator,
    `${outputDir}/${artifactName(route, null, `${stem}-active`)}`,
  );
}

async function captureDesktop(browser, baseUrl, outputDir, route) {
  const context = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await preparePage(page, baseUrl, route);

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(
      page,
      summary,
      `${outputDir}/${artifactName(route, null, "desktop-summary")}`,
    );
  }

  const overlay = page
    .locator(
      'figure.media[data-caption-view="overlay"]:visible:has(> .media__caption .media__text)',
    )
    .first();
  await captureHoverPair(page, overlay, outputDir, route, "desktop-overlay");

  const railOverlay = page
    .locator(
      ':is(.media-group[data-layout="strip"], .media-group[data-layout="grid"][data-overflow="reel"]) > .media-group__items > figure.media[data-caption-view="overlay"]:visible:has(> .media__caption)',
    )
    .first();
  await captureHoverPair(page, railOverlay, outputDir, route, "desktop-rail-overlay");

  const brandOverlay = page
    .locator('.brand-system__item:visible:has(.brand-system__hover-copy)')
    .first();
  await captureHoverPair(page, brandOverlay, outputDir, route, "desktop-brand-system-overlay");

  const jesteiOverlay = page
    .locator('.jestei-captioned-media:visible:has(.jestei-media__hover-copy)')
    .first();
  await captureHoverPair(page, jesteiOverlay, outputDir, route, "desktop-jestei-overlay");

  const source = page
    .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
    .first();
  if (await source.count()) {
    await source.click({ force: true });
    await page.waitForTimeout(100);
    await page.screenshot({
      path: `${outputDir}/${artifactName(route, null, "desktop-lightbox")}`,
    });
  }

  await context.close();
}

async function captureMobileViewport(browser, baseUrl, outputDir, route, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await preparePage(page, baseUrl, route);

  const sequence = page
    .locator(
      '.media-group[data-layout="sequence"]:has(figure.media[data-caption-view="overlay"] > .media__caption)',
    )
    .first();
  if (await sequence.count()) {
    await sequence.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(
      page,
      sequence,
      `${outputDir}/${artifactName(route, viewport, "sequence")}`,
    );
  }

  const summary = page
    .locator('figure.media[data-caption-view="summary"]:visible:has(> .media__caption)')
    .first();
  if (await summary.count()) {
    await summary.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    await captureLocator(
      page,
      summary,
      `${outputDir}/${artifactName(route, viewport, "summary-control")}`,
    );
  }

  if (viewport.width === 390) {
    const source = page
      .locator('figure.media:visible:has(.media__title) [data-lightbox-source]:visible')
      .first();
    if (await source.count()) {
      await source.tap({ force: true });
      await page.waitForTimeout(100);
      await page.screenshot({
        path: `${outputDir}/${artifactName(route, viewport, "lightbox")}`,
      });
    }
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

  await captureDesktop(browser, baseUrl, absoluteOutputDir, JESTEI_ROUTE);
  for (const viewport of MOBILE_VIEWPORTS) {
    await captureMobileViewport(browser, baseUrl, absoluteOutputDir, JESTEI_ROUTE, viewport);
  }

  console.log(`Caption QA screenshots written to ${absoluteOutputDir}`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => captureCaptionQa({ browser, baseUrl }));
}
