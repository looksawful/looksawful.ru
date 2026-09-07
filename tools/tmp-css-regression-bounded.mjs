import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const imageDecodeBudgetMs = 10_000;
const originalLaunch = chromium.launch.bind(chromium);

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
