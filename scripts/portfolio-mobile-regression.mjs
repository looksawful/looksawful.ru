import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.URL || process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:5173";
const outDir = process.env.SCREENSHOT_DIR || "_local/screens";
const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440];

const screenshotName = (width) => {
  if (width === 768) return "tablet-768.png";
  if (width === 1440) return "desktop-1440.png";
  return `mobile-${width}.png`;
};

const getVisibleTextCount = async (page, text) =>
  page.locator(`text=${text}`).evaluateAll((nodes) =>
    nodes.filter((node) => {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).length,
  );

const getCanvasPaintMetrics = async (page, selector) =>
  page.locator(selector).evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas.width || !canvas.height) {
      return { width: rect.width, height: rect.height, nonBlackRatio: 0, sampled: false };
    }

    const sampleWidth = Math.min(80, canvas.width);
    const sampleHeight = Math.min(80, canvas.height);
    const image = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let nonBlack = 0;

    for (let index = 0; index < image.length; index += 4) {
      if (image[index] > 12 || image[index + 1] > 12 || image[index + 2] > 12) {
        nonBlack += 1;
      }
    }

    return {
      width: rect.width,
      height: rect.height,
      nonBlackRatio: nonBlack / (image.length / 4),
      sampled: true,
    };
  });

const warmLazySections = async (page) => {
  for (const progress of [0, 0.18, 0.34, 0.5, 0.66, 0.82, 1]) {
    await page.evaluate((scrollProgress) => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: maxScroll * scrollProgress, behavior: "instant" });
    }, progress);
    await page.waitForTimeout(260);
  }

  for (const selector of [
    "[data-showcase] .filter-fullscreen-wrapper",
    "#project-jestei-promo-diagonal",
    "#jestei-landings",
    "[data-pet-preview]",
  ]) {
    const target = page.locator(selector).first();
    if (await target.count()) {
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
  }
};

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: width >= 1024 ? 1000 : 900 },
  });

  const consoleIssues = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleIssues.push(message.text());
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  await warmLazySections(page);

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hero: Boolean(document.querySelector("#hero")),
    topNav: Boolean(document.querySelector(".site-header, [data-site-header]")),
    showcase: Boolean(document.querySelector("[data-showcase]")),
    showcaseToc: Boolean(document.querySelector("[data-portfolio-toc], .portfolio-toc")),
    filter: Boolean(document.querySelector("[data-showcase] .filter-fullscreen-wrapper .jp-filter")),
    policyOpen: document.querySelectorAll("[data-showcase] [data-artifact-fullscreen-open]").length,
    petPreviews: document.querySelectorAll("[data-showcase] [data-pet-preview]").length,
    petOpen: [...document.querySelectorAll("[data-showcase] [data-pet-preview]")].filter((preview) =>
      preview.previousElementSibling?.matches("[data-artifact-fullscreen-open]"),
    ).length,
    filterButtons: document.querySelectorAll("[data-showcase] .filter-fullscreen-btn").length,
    artifactFilterButtons: document.querySelectorAll("[data-showcase] .filter-fullscreen-wrapper ~ [data-artifact-fullscreen-open], [data-showcase] .filter-fullscreen-wrapper + [data-artifact-fullscreen-open]").length,
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
  }));

  const overflow = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.clientWidth;
  if (overflow > 2) failures.push(`width ${width}: horizontal overflow ${overflow}px`);
  if (!metrics.hero) failures.push(`width ${width}: #hero missing`);
  if (!metrics.topNav) failures.push(`width ${width}: top nav missing`);
  if (!metrics.showcase) failures.push(`width ${width}: #showcase missing`);
  if (!metrics.showcaseToc) failures.push(`width ${width}: showcase toc missing`);
  if (!metrics.filter) failures.push(`width ${width}: filter artifact missing`);
  if (metrics.filterButtons !== 1) failures.push(`width ${width}: expected one filter fullscreen button, got ${metrics.filterButtons}`);
  if (metrics.artifactFilterButtons > 0) failures.push(`width ${width}: duplicate artifact fullscreen button near filter`);
  if (metrics.petPreviews && metrics.petOpen < metrics.petPreviews) failures.push(`width ${width}: pet fullscreen buttons missing`);

  const visibleSectionKickers = await getVisibleTextCount(page, "секция 01");
  if (visibleSectionKickers > 0) failures.push(`width ${width}: visible section kicker text`);

  for (const source of metrics.brokenImages) {
    failures.push(`width ${width}: broken image ${source}`);
  }

  if (width === 390 || width === 1440) {
    const promoCanvas = page.locator("#project-jestei-promo-diagonal");
    if (await promoCanvas.count()) {
      await promoCanvas.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1400);
      const canvasMetrics = await getCanvasPaintMetrics(page, "#project-jestei-promo-diagonal");
      if (canvasMetrics.width < 220 || canvasMetrics.height < 220) {
        failures.push(`width ${width}: promo canvas too small ${Math.round(canvasMetrics.width)}x${Math.round(canvasMetrics.height)}`);
      }
      if (canvasMetrics.sampled && canvasMetrics.nonBlackRatio < 0.02) {
        failures.push(`width ${width}: promo canvas looks empty`);
      }
    }
  }

  await page.screenshot({
    path: path.join(outDir, screenshotName(width)),
    fullPage: true,
  });

  for (const issue of consoleIssues.filter((entry) => !/WebGL|THREE|GL_INVALID|favicon/i.test(entry))) {
    failures.push(`width ${width}: console ${issue}`);
  }

  console.log(`checked ${width}px overflow=${overflow}`);
  await page.close();
}

const reducedMotionPage = await browser.newPage({
  viewport: { width: 390, height: 900 },
  reducedMotion: "reduce",
});
await reducedMotionPage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60000 });
const reducedMotionState = await reducedMotionPage.locator('[data-color-headline="jestei"]').evaluate((headline) => ({
  ready: headline.dataset.colorHeadlineReady === "true",
  animatedLetters: headline.querySelectorAll("[data-color-headline-letter]").length,
}));
if (!reducedMotionState.ready || reducedMotionState.animatedLetters === 0) {
  failures.push("reduced motion: color headline fallback did not initialize");
}
await reducedMotionPage.close();

await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
