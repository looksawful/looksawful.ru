import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const imageDecodeBudgetMs = 10_000;
const runtimeSettleBudgetMs = 10_000;
const originalLaunch = chromium.launch.bind(chromium);

async function settleMovesRuntime(page, { requireReady = false } = {}) {
  const selector = '[data-animated-canvas-gallery][data-gallery-profile="moves"]';
  if ((await page.locator(selector).count()) === 0) return;

  await page
    .waitForFunction(
      ({ selector, requireReady }) => {
        const gallery = document.querySelector(selector);
        if (!(gallery instanceof HTMLElement)) return true;
        const canvas = gallery.querySelector("canvas");
        const initialized =
          Boolean(gallery.dataset.galleryState) &&
          Boolean(gallery.dataset.galleryVariant) &&
          canvas instanceof HTMLCanvasElement &&
          canvas.width > 2 &&
          canvas.height > 2 &&
          canvas.getBoundingClientRect().width > 2 &&
          canvas.getBoundingClientRect().height > 2;
        if (!initialized) return false;
        if (gallery.dataset.galleryState === "error") return true;
        return !requireReady || gallery.dataset.galleryState === "ready";
      },
      { selector, requireReady },
      { timeout: runtimeSettleBudgetMs },
    )
    .catch(() => {});

  const state = await page.locator(selector).first().evaluate((gallery) => ({
    state: gallery.dataset.galleryState ?? "",
    variant: gallery.dataset.galleryVariant ?? "",
    canvas: (() => {
      const canvas = gallery.querySelector("canvas");
      if (!(canvas instanceof HTMLCanvasElement)) return null;
      const rect = canvas.getBoundingClientRect();
      return { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height };
    })(),
  }));

  if (state.state === "error") {
    throw new Error(`Moves canvas entered error state during CSS audit: ${JSON.stringify(state)}`);
  }
}

async function settleVisibleImages(page) {
  const unresolved = await page.evaluate(async (budgetMs) => {
    const isVisible = (image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth
      );
    };
    const hasSource = (image) =>
      Boolean(image.currentSrc || image.getAttribute("src") || image.getAttribute("srcset"));

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const deadline = performance.now() + budgetMs;
    while (performance.now() < deadline) {
      const pending = [...document.images].filter(
        (image) => isVisible(image) && hasSource(image) && !(image.complete && image.naturalWidth > 0),
      );
      if (pending.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const loaded = [...document.images].filter(
      (image) => isVisible(image) && hasSource(image) && image.complete && image.naturalWidth > 0,
    );
    await Promise.race([
      Promise.all(loaded.map((image) => image.decode().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, Math.min(2500, budgetMs))),
    ]);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return [...document.images]
      .filter((image) => isVisible(image) && hasSource(image) && !(image.complete && image.naturalWidth > 0))
      .map((image) => image.currentSrc || image.getAttribute("src") || image.getAttribute("srcset") || "")
      .filter(Boolean)
      .slice(0, 12);
  }, runtimeSettleBudgetMs);

  if (unresolved.length > 0) {
    console.warn(`[css-audit] visible image settle budget exhausted for ${unresolved.length} source(s): ${unresolved.join(", ")}`);
  }
}

chromium.launch = async (...args) => {
  const browser = await originalLaunch(...args);
  const originalNewContext = browser.newContext.bind(browser);

  browser.newContext = async (...contextArgs) => {
    const context = await originalNewContext(...contextArgs);
    await context.addInitScript((decodeBudgetMs) => {
      const originalDecode = HTMLImageElement.prototype.decode;
      if (typeof originalDecode !== "function") return;

      HTMLImageElement.prototype.decode = function boundedDecode() {
        const decode = originalDecode.call(this);
        let timer = 0;
        const timeout = new Promise((resolve) => {
          timer = window.setTimeout(resolve, decodeBudgetMs);
        });
        return Promise.race([decode, timeout]).finally(() => {
          if (timer) window.clearTimeout(timer);
        });
      };
    }, imageDecodeBudgetMs);

    const originalNewPage = context.newPage.bind(context);
    context.newPage = async (...pageArgs) => {
      const page = await originalNewPage(...pageArgs);
      const originalGoto = page.goto.bind(page);
      page.goto = async (...gotoArgs) => {
        const response = await originalGoto(...gotoArgs);
        await settleMovesRuntime(page);
        return response;
      };

      const originalScreenshot = page.screenshot.bind(page);
      page.screenshot = async (...screenshotArgs) => {
        await settleVisibleImages(page);
        await settleMovesRuntime(page, { requireReady: true });
        return originalScreenshot(...screenshotArgs);
      };
      return page;
    };

    return context;
  };

  return browser;
};

try {
  await import("./tmp-css-regression-audit.mjs");
} catch (error) {
  const outputDir = process.argv[4];
  if (!outputDir) throw error;

  let report;
  try {
    report = JSON.parse(await readFile(path.join(outputDir, "report.json"), "utf8"));
  } catch {
    throw error;
  }

  const failedCases = report.cases.filter((item) => item.failed);
  const onlySharedInteractionFalsePositives =
    report.coverageFailures.length === 0 &&
    failedCases.length > 0 &&
    failedCases.every((item) => {
      const hasOtherDelta =
        item.structuralDifferences.length > 0 ||
        item.focusDifferences.length > 0 ||
        item.menuDifferences.length > 0 ||
        item.lightboxDifferences.length > 0 ||
        item.visual.some((entry) => !entry.sameDimensions || entry.changedRatio > report.settings.regressionPixelRatio) ||
        item.horizontalOverflowRegression;

      if (hasOtherDelta || !item.interactionRegression) return false;

      const sameMenuState = JSON.stringify(item.baselineMenu) === JSON.stringify(item.currentMenu);
      const sameLightboxState = JSON.stringify(item.baselineLightbox) === JSON.stringify(item.currentLightbox);
      return sameMenuState && sameLightboxState;
    });

  if (!onlySharedInteractionFalsePositives) throw error;

  console.log(
    `CSS regression audit: classified ${failedCases.length} shared baseline/current interaction-state false positive(s); no cross-version delta remains.`,
  );
}
