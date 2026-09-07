import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const [baselineUrl, currentUrl, outputDir] = process.argv.slice(2);
if (!baselineUrl || !currentUrl || !outputDir) {
  throw new Error(
    "usage: node tools/tmp-css-media-fit-audit.mjs <baseline-url> <current-url> <output-dir>",
  );
}

const routes = [
  "/",
  "/work/jestei-pool/",
  "/work/styx/",
  "/work/sensetique/",
  "/shootings/",
  "/work/berry-social-content-2020/",
  "/work/awful-cases/",
  "/work/moves-awful/",
];

// Includes the project's historically sensitive responsive thresholds, not only
// generic phone/tablet/desktop widths.
const viewports = [
  { name: "mobile-390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "grid-670", width: 670, height: 900, isMobile: false, hasTouch: true },
  { name: "grid-770", width: 770, height: 900, isMobile: false, hasTouch: true },
  { name: "grid-835", width: 835, height: 900, isMobile: false, hasTouch: true },
  { name: "tablet-1024", width: 1024, height: 768, isMobile: false, hasTouch: true },
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "wide-1728", width: 1728, height: 1000, isMobile: false, hasTouch: false },
];

const sourceVisibilityTolerance = 0.08;
const surfaceFillTolerance = 0.08;
const ratioTolerance = 0.08;
const imageDecodeBudgetMs = 8_000;

const normalizeSource = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
};

const slug = (value) =>
  value === "/"
    ? "home"
    : value
        .replace(/^\/+|\/+$/g, "")
        .replaceAll("/", "-")
        .replace(/[^a-z0-9-]+/gi, "-");

await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, "evidence"), { recursive: true });

async function settle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
  await page.evaluate(async (decodeBudgetMs) => {
    await document.fonts?.ready;
    const images = [...document.images];
    let timer = 0;
    await Promise.race([
      Promise.allSettled(images.map((image) => image.decode())),
      new Promise((resolve) => {
        timer = window.setTimeout(resolve, decodeBudgetMs);
      }),
    ]);
    if (timer) window.clearTimeout(timer);
    for (const video of document.querySelectorAll("video")) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {}
    }
    window.scrollTo(0, 0);
  }, imageDecodeBudgetMs);
  await page.waitForTimeout(120);
}

function classifyGeometry(width, height, sourceWidth, sourceHeight, objectFit) {
  if (!(width > 0 && height > 0 && sourceWidth > 0 && sourceHeight > 0)) {
    return {
      boxRatio: null,
      sourceRatio: null,
      sourceVisibleFraction: null,
      surfaceFillFraction: null,
    };
  }

  const boxRatio = width / height;
  const sourceRatio = sourceWidth / sourceHeight;
  const containScale = Math.min(width / sourceWidth, height / sourceHeight);
  const coverScale = Math.max(width / sourceWidth, height / sourceHeight);

  const containWidth = sourceWidth * containScale;
  const containHeight = sourceHeight * containScale;
  const coverWidth = sourceWidth * coverScale;
  const coverHeight = sourceHeight * coverScale;

  if (objectFit === "contain" || objectFit === "scale-down") {
    return {
      boxRatio,
      sourceRatio,
      sourceVisibleFraction: 1,
      surfaceFillFraction: Math.min(1, (containWidth * containHeight) / (width * height)),
    };
  }

  if (objectFit === "cover") {
    return {
      boxRatio,
      sourceRatio,
      sourceVisibleFraction: Math.min(1, (width * height) / (coverWidth * coverHeight)),
      surfaceFillFraction: 1,
    };
  }

  return {
    boxRatio,
    sourceRatio,
    sourceVisibleFraction: 1,
    surfaceFillFraction: 1,
  };
}

async function snapshotMedia(page) {
  return page.evaluate(() => {
    const normalize = (value) => {
      if (!value) return "";
      try {
        const url = new URL(value, location.href);
        return `${url.pathname}${url.search}`;
      } catch {
        return value;
      }
    };
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return {
        x: Math.round(value.x * 1000) / 1000,
        y: Math.round(value.y * 1000) / 1000,
        width: Math.round(value.width * 1000) / 1000,
        height: Math.round(value.height * 1000) / 1000,
      };
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        box.width > 1 &&
        box.height > 1
      );
    };
    const sourceFor = (element) => {
      if (element instanceof HTMLImageElement) return element.currentSrc || element.src;
      if (element instanceof HTMLVideoElement) {
        return element.currentSrc || element.src || element.querySelector("source")?.src || "";
      }
      return "";
    };

    const counts = new Map();
    const result = [];
    for (const element of document.querySelectorAll("img, video")) {
      if (!(element instanceof HTMLImageElement || element instanceof HTMLVideoElement)) continue;
      if (!visible(element)) continue;
      const source = normalize(sourceFor(element));
      if (!source) continue;
      const occurrence = counts.get(source) ?? 0;
      counts.set(source, occurrence + 1);

      const style = getComputedStyle(element);
      const surface = element.closest(
        ".media__surface, .slider__slide, .mockup__screen, .page-flip__page, [data-before-after], .project-card__media, .media-group__item",
      );
      const surfaceStyle = surface instanceof Element ? getComputedStyle(surface) : style;
      const mediaRect = rect(element);
      const surfaceRect = surface instanceof Element ? rect(surface) : mediaRect;
      const sourceWidth =
        element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth || Number(element.dataset.mediaWidth) || 0;
      const sourceHeight =
        element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight || Number(element.dataset.mediaHeight) || 0;

      result.push({
        key: `${source}#${occurrence}`,
        source,
        occurrence,
        tag: element.tagName.toLowerCase(),
        sourceWidth,
        sourceHeight,
        mediaRect,
        surfaceRect,
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        overflowX: surfaceStyle.overflowX,
        overflowY: surfaceStyle.overflowY,
        variables: {
          objectFit: style.getPropertyValue("--object-fit").trim(),
          objectPosition: style.getPropertyValue("--object-position").trim(),
          mediaFit: style.getPropertyValue("--media-fit").trim(),
          mediaPosition: style.getPropertyValue("--media-position").trim(),
          mediaRatio: style.getPropertyValue("--media-ratio").trim(),
          mediaBlockSize: style.getPropertyValue("--media-block-size").trim(),
        },
        context: {
          mediaId: element.closest("[data-media-id]")?.getAttribute("data-media-id") ?? "",
          sectionId: element.closest("[id]")?.id ?? "",
          surfaceClass: surface instanceof HTMLElement ? surface.className : "",
          parentClass: element.parentElement?.className ?? "",
        },
      });
    }
    return result;
  });
}

function approxEqual(left, right, tolerance) {
  if (left == null || right == null) return left === right;
  return Math.abs(left - right) <= tolerance;
}

function compareMedia(baseline, current) {
  const baselineGeometry = classifyGeometry(
    baseline.mediaRect.width,
    baseline.mediaRect.height,
    baseline.sourceWidth,
    baseline.sourceHeight,
    baseline.objectFit,
  );
  const currentGeometry = classifyGeometry(
    current.mediaRect.width,
    current.mediaRect.height,
    current.sourceWidth,
    current.sourceHeight,
    current.objectFit,
  );

  const reasons = [];
  if (baseline.objectFit !== current.objectFit) {
    reasons.push(`object-fit ${baseline.objectFit} -> ${current.objectFit}`);
  }
  if (baseline.objectPosition !== current.objectPosition) {
    reasons.push(`object-position ${baseline.objectPosition} -> ${current.objectPosition}`);
  }
  for (const variable of ["objectFit", "objectPosition", "mediaFit", "mediaPosition", "mediaRatio"]) {
    if (baseline.variables[variable] !== current.variables[variable]) {
      reasons.push(`--${variable} ${baseline.variables[variable] || "<empty>"} -> ${current.variables[variable] || "<empty>"}`);
    }
  }
  if (
    baselineGeometry.sourceVisibleFraction != null &&
    currentGeometry.sourceVisibleFraction != null &&
    currentGeometry.sourceVisibleFraction < baselineGeometry.sourceVisibleFraction - sourceVisibilityTolerance
  ) {
    reasons.push(
      `source-visible ${(baselineGeometry.sourceVisibleFraction * 100).toFixed(1)}% -> ${(currentGeometry.sourceVisibleFraction * 100).toFixed(1)}%`,
    );
  }
  if (
    baselineGeometry.surfaceFillFraction != null &&
    currentGeometry.surfaceFillFraction != null &&
    currentGeometry.surfaceFillFraction < baselineGeometry.surfaceFillFraction - surfaceFillTolerance
  ) {
    reasons.push(
      `surface-fill ${(baselineGeometry.surfaceFillFraction * 100).toFixed(1)}% -> ${(currentGeometry.surfaceFillFraction * 100).toFixed(1)}%`,
    );
  }
  if (!approxEqual(baselineGeometry.boxRatio, currentGeometry.boxRatio, ratioTolerance)) {
    reasons.push(
      `media-box-ratio ${baselineGeometry.boxRatio?.toFixed(3) ?? "n/a"} -> ${currentGeometry.boxRatio?.toFixed(3) ?? "n/a"}`,
    );
  }

  return {
    failed: reasons.length > 0,
    reasons,
    baseline: { ...baseline, geometry: baselineGeometry },
    current: { ...current, geometry: currentGeometry },
  };
}

async function captureEvidence(page, item, filePath) {
  const locator = page.locator("img, video").filter({ hasNot: page.locator("[hidden]") });
  const count = await locator.count();
  let matchedOccurrence = 0;
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    const info = await candidate.evaluate((element) => {
      const source =
        element instanceof HTMLImageElement
          ? element.currentSrc || element.src
          : element instanceof HTMLVideoElement
            ? element.currentSrc || element.src || element.querySelector("source")?.src || ""
            : "";
      try {
        const url = new URL(source, location.href);
        return `${url.pathname}${url.search}`;
      } catch {
        return source;
      }
    });
    if (info !== item.source) continue;
    if (matchedOccurrence !== item.occurrence) {
      matchedOccurrence += 1;
      continue;
    }
    await candidate.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const surface = candidate.locator(
      "xpath=ancestor-or-self::*[contains(concat(' ', normalize-space(@class), ' '), ' media__surface ') or contains(concat(' ', normalize-space(@class), ' '), ' slider__slide ') or @data-before-after][1]",
    );
    const target = (await surface.count()) > 0 ? surface : candidate;
    await target.screenshot({ path: filePath, animations: "disabled" });
    return true;
  }
  return false;
}

const browser = await chromium.launch();
const reportCases = [];
const failures = [];

try {
  for (const viewport of viewports) {
    const contextOptions = {
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      reducedMotion: "reduce",
      colorScheme: "light",
      locale: "en-US",
    };
    const baselineContext = await browser.newContext(contextOptions);
    const currentContext = await browser.newContext(contextOptions);
    const baselinePage = await baselineContext.newPage();
    const currentPage = await currentContext.newPage();

    for (const route of routes) {
      const caseKey = `${slug(route)}-${viewport.name}`;
      console.log(`CASE start ${caseKey}`);
      await Promise.all([
        settle(baselinePage, new URL(route, baselineUrl).href),
        settle(currentPage, new URL(route, currentUrl).href),
      ]);
      const [baselineItems, currentItems] = await Promise.all([
        snapshotMedia(baselinePage),
        snapshotMedia(currentPage),
      ]);
      const baselineByKey = new Map(baselineItems.map((item) => [item.key, item]));
      const currentByKey = new Map(currentItems.map((item) => [item.key, item]));
      const matched = [];
      const caseFailures = [];
      for (const [key, baselineItem] of baselineByKey) {
        const currentItem = currentByKey.get(key);
        if (!currentItem) continue;
        const comparison = compareMedia(baselineItem, currentItem);
        matched.push(comparison);
        if (comparison.failed) caseFailures.push(comparison);
      }

      const unmatchedBaseline = [...baselineByKey.keys()].filter((key) => !currentByKey.has(key));
      const unmatchedCurrent = [...currentByKey.keys()].filter((key) => !baselineByKey.has(key));

      for (let index = 0; index < Math.min(caseFailures.length, 12); index += 1) {
        const failure = caseFailures[index];
        const evidenceBase = `${caseKey}-${index}-${slug(failure.baseline.source)}`;
        const baselineEvidence = path.join(outputDir, "evidence", `${evidenceBase}-baseline.png`);
        const currentEvidence = path.join(outputDir, "evidence", `${evidenceBase}-current.png`);
        await Promise.all([
          captureEvidence(baselinePage, failure.baseline, baselineEvidence),
          captureEvidence(currentPage, failure.current, currentEvidence),
        ]);
        failure.evidence = { baseline: baselineEvidence, current: currentEvidence };
      }

      const record = {
        key: caseKey,
        route,
        viewport,
        matchedCount: matched.length,
        failureCount: caseFailures.length,
        unmatchedBaseline,
        unmatchedCurrent,
        failures: caseFailures,
      };
      reportCases.push(record);
      if (caseFailures.length) failures.push(record);
      console.log(
        `${caseFailures.length ? "FAIL" : "PASS"} ${caseKey}: matched=${matched.length} fit-regressions=${caseFailures.length} unmatched-old=${unmatchedBaseline.length} unmatched-current=${unmatchedCurrent.length}`,
      );
    }

    await baselineContext.close();
    await currentContext.close();
  }
} finally {
  await browser.close();
}

const report = {
  baseline: process.env.BASELINE_SHA ?? null,
  current: process.env.CURRENT_SHA ?? null,
  generatedAt: new Date().toISOString(),
  settings: {
    routes,
    viewports,
    sourceVisibilityTolerance,
    surfaceFillTolerance,
    ratioTolerance,
    note: "Unmatched media is reported but does not by itself fail this CSS-fit audit; matched media fails on presentation/crop regressions.",
  },
  summary: {
    cases: reportCases.length,
    failedCases: failures.length,
    fitRegressions: reportCases.reduce((sum, item) => sum + item.failureCount, 0),
    unmatchedBaseline: reportCases.reduce((sum, item) => sum + item.unmatchedBaseline.length, 0),
    unmatchedCurrent: reportCases.reduce((sum, item) => sum + item.unmatchedCurrent.length, 0),
  },
  cases: reportCases,
};

await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = [
  "# Media fit regression audit",
  "",
  `- Baseline: \`${report.baseline ?? "unknown"}\``,
  `- Current: \`${report.current ?? "unknown"}\``,
  `- Cases: ${report.summary.cases}`,
  `- Failed cases: ${report.summary.failedCases}`,
  `- Fit regressions: ${report.summary.fitRegressions}`,
  `- Old-only media occurrences: ${report.summary.unmatchedBaseline}`,
  `- Current-only media occurrences: ${report.summary.unmatchedCurrent}`,
  "",
  "## Failures",
  "",
  ...(failures.length
    ? failures.flatMap((record) => [
        `### ${record.key}`,
        ...record.failures.flatMap((failure) => [
          `- \`${failure.baseline.source}\` #${failure.baseline.occurrence}: ${failure.reasons.join("; ")}`,
        ]),
        "",
      ])
    : ["None.", ""]),
].join("\n");
await writeFile(path.join(outputDir, "report.md"), `${markdown}\n`);

if (report.summary.fitRegressions > 0) {
  throw new Error(`Media fit regression audit found ${report.summary.fitRegressions} matched-media regression(s)`);
}

console.log(`Media fit regression audit passed ${report.summary.cases}/${report.summary.cases} route/viewport cases.`);
