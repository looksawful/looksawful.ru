import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";
import sharp from "sharp";

const [baselineUrl, currentUrl, outputDir] = process.argv.slice(2);
if (!baselineUrl || !currentUrl || !outputDir) {
  throw new Error(
    "usage: node tools/tmp-css-regression-audit.mjs <baseline-url> <current-url> <output-dir>",
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

const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "tablet", width: 834, height: 1112, isMobile: false, hasTouch: true },
  { name: "desktop", width: 1728, height: 1000, isMobile: false, hasTouch: false },
];

const motionModes = ["reduce", "no-preference"];

const selectors = [
  "html",
  "body",
  ".site-nav",
  ".site-nav__bar",
  ".site-nav__toggle",
  ".site-nav__menu",
  ".menu-preview",
  ".projects-grid",
  ".project-card",
  ".portfolio-showcase",
  ".expertise",
  ".expertise__item",
  ".experience",
  ".experience__item",
  ".tools",
  ".code-block",
  ".projects",
  ".project",
  ".project__head",
  ".project__name",
  ".project__role",
  ".project__period",
  ".project-nav",
  ".project-nav__inner",
  ".project-nav__link",
  ".project-nav__top",
  ".project__intro",
  ".project__title",
  ".project__summary",
  ".project__lead",
  ".project__links",
  ".project__section",
  ".section-copy",
  ".section-copy__title",
  ".section-copy__text",
  ".divider",
  ".group-note",
  ".editorial-note",
  ".credits",
  ".media",
  ".media__surface",
  ".media-group",
  ".media-group__items",
  ".slider",
  ".mockup",
  ".justified-gallery",
  "[data-page-flip]",
  "[data-before-after]",
];

const requiredCoverage = [
  ".site-nav",
  ".project-card",
  ".expertise",
  ".experience",
  ".code-block",
  ".projects",
  ".project",
  ".project__head",
  ".project-nav",
  ".project__intro",
  ".project__title",
  ".project__section",
  ".section-copy",
  ".media",
  ".media__surface",
  ".media-group",
];

const styleProperties = [
  "display",
  "position",
  "boxSizing",
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "gridAutoFlow",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "alignContent",
  "overflowX",
  "overflowY",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "fontWeight",
  "textAlign",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRadius",
  "objectFit",
  "objectPosition",
  "aspectRatio",
  "transform",
  "translate",
  "opacity",
  "visibility",
  "pointerEvents",
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
  "animationName",
  "animationDuration",
];

const pixelThreshold = 8;
const regressionPixelRatio = 0.0005;
const numericTolerance = 0.75;
const scrollFractions = [0, 0.5, 1];

await mkdir(outputDir, { recursive: true });
await mkdir(path.join(outputDir, "screenshots"), { recursive: true });

const slug = (value) =>
  value === "/"
    ? "home"
    : value
        .replace(/^\/+|\/+$/g, "")
        .replaceAll("/", "-")
        .replace(/[^a-z0-9-]+/gi, "-");

async function settle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    for (const video of document.querySelectorAll("video")) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {}
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(150);
}

async function snapshotPage(page) {
  return page.evaluate(
    ({ selectors, styleProperties }) => {
      const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
      const rectValue = (rect) => ({
        x: Math.round(rect.x * 1000) / 1000,
        y: Math.round(rect.y * 1000) / 1000,
        width: Math.round(rect.width * 1000) / 1000,
        height: Math.round(rect.height * 1000) / 1000,
      });
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) !== 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const selectorSnapshots = {};
      for (const selector of selectors) {
        const nodes = [...document.querySelectorAll(selector)];
        const visibleNodes = nodes.filter(visible);
        selectorSnapshots[selector] = {
          total: nodes.length,
          visible: visibleNodes.length,
          samples: visibleNodes.slice(0, 8).map((element) => {
            const style = getComputedStyle(element);
            const computed = {};
            for (const property of styleProperties) computed[property] = style[property];
            return {
              tag: element.tagName,
              id: element.id,
              className: typeof element.className === "string" ? element.className : "",
              rect: rectValue(element.getBoundingClientRect()),
              computed,
              variables: {
                mediaFit: style.getPropertyValue("--media-fit").trim(),
                mediaPosition: style.getPropertyValue("--media-position").trim(),
                mediaRatio: style.getPropertyValue("--media-ratio").trim(),
                mediaBlockSize: style.getPropertyValue("--media-block-size").trim(),
              },
            };
          }),
        };
      }

      return {
        document: {
          title: document.title,
          pageType: document.body?.dataset?.pageType ?? "",
          lang: document.documentElement.lang,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          bodyText: normalizeText(document.body?.innerText ?? ""),
          headings: [...document.querySelectorAll("h1, h2, h3")].map((heading) => ({
            level: heading.tagName,
            text: normalizeText(heading.textContent ?? ""),
          })),
          links: [...document.querySelectorAll("a[href]")].map((link) => link.getAttribute("href")),
          interactiveCount: document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ).length,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
          coarsePointer: matchMedia("(pointer: coarse)").matches,
          finePointer: matchMedia("(pointer: fine)").matches,
          hover: matchMedia("(hover: hover)").matches,
        },
        selectors: selectorSnapshots,
      };
    },
    { selectors, styleProperties },
  );
}

async function focusSequence(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  const sequence = [];
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    sequence.push(
      await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          id: element.id,
          className: typeof element.className === "string" ? element.className : "",
          href: element.getAttribute("href"),
          role: element.getAttribute("role"),
          ariaLabel: element.getAttribute("aria-label"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      }),
    );
  }
  return sequence;
}

async function siteMenuContract(page) {
  const toggle = page.locator("[data-site-menu-toggle]").first();
  if ((await toggle.count()) === 0 || !(await toggle.isVisible())) return { available: false };
  const before = await toggle.getAttribute("aria-expanded");
  await toggle.click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded") === "true" &&
      document.querySelector("[data-site-menu]")?.hidden === false,
    null,
    { timeout: 5_000 },
  );
  const opened = await page.evaluate(() => ({
    expanded: document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded"),
    hidden: document.querySelector("[data-site-menu]")?.hidden,
    bodyOverflow: getComputedStyle(document.body).overflow,
  }));
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded") === "false" &&
      document.querySelector("[data-site-menu]")?.hidden === true,
    null,
    { timeout: 5_000 },
  );
  const closed = await page.evaluate(() => ({
    expanded: document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded"),
    hidden: document.querySelector("[data-site-menu]")?.hidden,
  }));
  return { available: true, before, opened, closed };
}

async function lightboxContract(page) {
  const source = page.locator("[data-lightbox-source]:visible").first();
  if ((await source.count()) === 0) return { available: false };
  await source.scrollIntoViewIfNeeded();
  await source.click({ force: true });
  const opened = await page
    .waitForFunction(
      () => window.pswp?.opener?.isOpen === true || Boolean(document.querySelector("[data-media-lightbox][open]")),
      null,
      { timeout: 7_500 },
    )
    .then(() => true)
    .catch(() => false);
  const state = opened
    ? await page.evaluate(() => ({
        pswp: window.pswp?.opener?.isOpen === true,
        dialog: Boolean(document.querySelector("[data-media-lightbox][open]")),
      }))
    : null;
  if (opened) {
    await page.keyboard.press("Escape");
    await page
      .waitForFunction(
        () => window.pswp?.opener?.isOpen !== true && !document.querySelector("[data-media-lightbox][open]"),
        null,
        { timeout: 7_500 },
      )
      .catch(() => {});
  }
  return { available: true, opened, state };
}

function compareValues(left, right, keyPath = "root", differences = []) {
  if (typeof left === "number" && typeof right === "number") {
    if (Math.abs(left - right) > numericTolerance) differences.push({ path: keyPath, baseline: left, current: right });
    return differences;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      differences.push({ path: keyPath, baseline: left, current: right });
      return differences;
    }
    for (let index = 0; index < left.length; index += 1) {
      compareValues(left[index], right[index], `${keyPath}[${index}]`, differences);
      if (differences.length >= 300) return differences;
    }
    return differences;
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      compareValues(left[key], right[key], `${keyPath}.${key}`, differences);
      if (differences.length >= 300) return differences;
    }
    return differences;
  }
  if (left !== right) differences.push({ path: keyPath, baseline: left, current: right });
  return differences;
}

async function comparePng(baselinePath, currentPath, diffPath) {
  const [baselineMeta, currentMeta] = await Promise.all([sharp(baselinePath).metadata(), sharp(currentPath).metadata()]);
  if (baselineMeta.width !== currentMeta.width || baselineMeta.height !== currentMeta.height || !baselineMeta.width || !baselineMeta.height) {
    return { sameDimensions: false, baseline: { width: baselineMeta.width, height: baselineMeta.height }, current: { width: currentMeta.width, height: currentMeta.height }, changedPixels: null, changedRatio: 1, maxDelta: 255, meanDelta: null };
  }
  const width = baselineMeta.width;
  const height = baselineMeta.height;
  const [baselineRaw, currentRaw] = await Promise.all([
    sharp(baselinePath).ensureAlpha().raw().toBuffer(),
    sharp(currentPath).ensureAlpha().raw().toBuffer(),
  ]);
  const diffRaw = Buffer.alloc(baselineRaw.length);
  let changedPixels = 0;
  let maxDelta = 0;
  let deltaTotal = 0;
  for (let offset = 0; offset < baselineRaw.length; offset += 4) {
    const dr = Math.abs(baselineRaw[offset] - currentRaw[offset]);
    const dg = Math.abs(baselineRaw[offset + 1] - currentRaw[offset + 1]);
    const db = Math.abs(baselineRaw[offset + 2] - currentRaw[offset + 2]);
    const da = Math.abs(baselineRaw[offset + 3] - currentRaw[offset + 3]);
    const delta = Math.max(dr, dg, db, da);
    maxDelta = Math.max(maxDelta, delta);
    deltaTotal += dr + dg + db + da;
    if (delta > pixelThreshold) changedPixels += 1;
    const visible = Math.min(255, delta * 5);
    diffRaw[offset] = visible;
    diffRaw[offset + 1] = visible;
    diffRaw[offset + 2] = visible;
    diffRaw[offset + 3] = 255;
  }
  await sharp(diffRaw, { raw: { width, height, channels: 4 } }).png().toFile(diffPath);
  const pixels = width * height;
  return { sameDimensions: true, baseline: { width, height }, current: { width, height }, changedPixels, changedRatio: changedPixels / pixels, maxDelta, meanDelta: deltaTotal / (pixels * 4) };
}

async function captureTiles(page, prefix) {
  await page.addStyleTag({
    content: `html { scroll-behavior: auto !important; } *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  });
  const results = [];
  for (const fraction of scrollFractions) {
    const scrollState = await page.evaluate((targetFraction) => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.round(maxScroll * targetFraction);
      window.scrollTo(0, y);
      return { y, maxScroll };
    }, fraction);
    await page.waitForTimeout(100);
    const screenshotPath = path.join(outputDir, "screenshots", `${prefix}-${fraction}.png`);
    await page.screenshot({
      path: screenshotPath,
      animations: "disabled",
      mask: [page.locator("canvas"), page.locator("video"), page.locator("iframe")],
      maskColor: "#777777",
    });
    results.push({ fraction, scrollState, screenshotPath });
  }
  return results;
}

const browser = await chromium.launch();
const cases = [];
const failures = [];
const coverage = Object.fromEntries(requiredCoverage.map((selector) => [selector, { baseline: 0, current: 0 }]));

try {
  for (const motion of motionModes) {
    for (const viewport of viewports) {
      const contextOptions = {
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.isMobile,
        hasTouch: viewport.hasTouch,
        reducedMotion: motion,
        colorScheme: "light",
        locale: "en-US",
      };
      const baselineContext = await browser.newContext(contextOptions);
      const currentContext = await browser.newContext(contextOptions);
      const baselinePage = await baselineContext.newPage();
      const currentPage = await currentContext.newPage();

      for (const route of routes) {
        const key = `${slug(route)}-${viewport.name}-${motion}`;
        await settle(baselinePage, new URL(route, baselineUrl).href);
        await settle(currentPage, new URL(route, currentUrl).href);

        const [baselineSnapshot, currentSnapshot] = await Promise.all([snapshotPage(baselinePage), snapshotPage(currentPage)]);
        for (const selector of requiredCoverage) {
          coverage[selector].baseline += baselineSnapshot.selectors[selector]?.total ?? 0;
          coverage[selector].current += currentSnapshot.selectors[selector]?.total ?? 0;
        }
        const structuralDifferences = compareValues(baselineSnapshot, currentSnapshot);

        const [baselineFocus, currentFocus] = await Promise.all([focusSequence(baselinePage), focusSequence(currentPage)]);
        const focusDifferences = compareValues(baselineFocus, currentFocus, "focus");

        await settle(baselinePage, new URL(route, baselineUrl).href);
        await settle(currentPage, new URL(route, currentUrl).href);
        const [baselineMenu, currentMenu] = await Promise.all([siteMenuContract(baselinePage), siteMenuContract(currentPage)]);
        const menuDifferences = compareValues(baselineMenu, currentMenu, "siteMenu");

        await settle(baselinePage, new URL(route, baselineUrl).href);
        await settle(currentPage, new URL(route, currentUrl).href);
        const [baselineLightbox, currentLightbox] = await Promise.all([lightboxContract(baselinePage), lightboxContract(currentPage)]);
        const lightboxDifferences = compareValues(baselineLightbox, currentLightbox, "lightbox");

        await settle(baselinePage, new URL(route, baselineUrl).href);
        await settle(currentPage, new URL(route, currentUrl).href);
        const [baselineTiles, currentTiles] = await Promise.all([
          captureTiles(baselinePage, `${key}-baseline`),
          captureTiles(currentPage, `${key}-current`),
        ]);
        const visual = [];
        for (let index = 0; index < baselineTiles.length; index += 1) {
          const baselineTile = baselineTiles[index];
          const currentTile = currentTiles[index];
          const diffPath = path.join(outputDir, "screenshots", `${key}-diff-${baselineTile.fraction}.png`);
          visual.push({
            fraction: baselineTile.fraction,
            baselineScroll: baselineTile.scrollState,
            currentScroll: currentTile.scrollState,
            diffPath,
            ...(await comparePng(baselineTile.screenshotPath, currentTile.screenshotPath, diffPath)),
          });
        }

        const visualFailures = visual.filter((item) => !item.sameDimensions || item.changedRatio > regressionPixelRatio);
        const horizontalOverflowRegression = currentSnapshot.document.horizontalOverflow && !baselineSnapshot.document.horizontalOverflow;
        const interactionRegression =
          (currentMenu.available && currentMenu.opened?.expanded !== "true") ||
          (currentMenu.available && currentMenu.closed?.expanded !== "false") ||
          (currentLightbox.available && currentLightbox.opened !== true);
        const failed = structuralDifferences.length > 0 || focusDifferences.length > 0 || menuDifferences.length > 0 || lightboxDifferences.length > 0 || visualFailures.length > 0 || horizontalOverflowRegression || interactionRegression;
        const record = { key, route, viewport, motion, failed, structuralDifferences, focusDifferences, menuDifferences, lightboxDifferences, horizontalOverflowRegression, interactionRegression, baselineMenu, currentMenu, baselineLightbox, currentLightbox, visual };
        cases.push(record);
        if (failed) failures.push(record);
        console.log(`${failed ? "FAIL" : "PASS"} ${key}: structural=${structuralDifferences.length} focus=${focusDifferences.length} menu=${menuDifferences.length} lightbox=${lightboxDifferences.length} visual=${visualFailures.length}`);
      }

      await baselineContext.close();
      await currentContext.close();
    }
  }
} finally {
  await browser.close();
}

const coverageFailures = Object.entries(coverage).filter(([, counts]) => counts.baseline === 0 || counts.current === 0);
for (const [selector, counts] of coverageFailures) failures.push({ key: `coverage:${selector}`, failed: true, coverage: counts });

const report = {
  baseline: process.env.BASELINE_SHA ?? null,
  current: process.env.CURRENT_SHA ?? null,
  generatedAt: new Date().toISOString(),
  settings: { routes, viewports, motionModes, selectors, requiredCoverage, scrollFractions, pixelThreshold, regressionPixelRatio, numericTolerance, dynamicVisualMask: "canvas, video, iframe" },
  coverage,
  coverageFailures,
  summary: { cases: cases.length, passed: cases.length - cases.filter((item) => item.failed).length, failedCases: cases.filter((item) => item.failed).length, coverageFailures: coverageFailures.length },
  cases,
};
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

const markdown = [
  "# CSS refactor regression audit",
  "",
  `- Baseline: \`${report.baseline ?? "unknown"}\``,
  `- Current: \`${report.current ?? "unknown"}\``,
  `- Cases: ${report.summary.cases}`,
  `- Passed cases: ${report.summary.passed}`,
  `- Failed cases: ${report.summary.failedCases}`,
  `- Coverage failures: ${report.summary.coverageFailures}`,
  `- Motion modes: ${motionModes.join(", ")}`,
  `- Visual threshold: ${(regressionPixelRatio * 100).toFixed(3)}% pixels above channel delta ${pixelThreshold}`,
  `- Geometry tolerance: ${numericTolerance}px`,
  "",
  "## Coverage failures",
  "",
  ...(coverageFailures.length ? coverageFailures.map(([selector, counts]) => `- ${selector}: baseline=${counts.baseline}, current=${counts.current}`) : ["None."]),
  "",
  "## Case failures",
  "",
  ...(cases.filter((item) => item.failed).length
    ? cases.filter((item) => item.failed).flatMap((item) => [
        `### ${item.key}`,
        `- structural differences: ${item.structuralDifferences.length}`,
        `- focus differences: ${item.focusDifferences.length}`,
        `- menu differences: ${item.menuDifferences.length}`,
        `- lightbox differences: ${item.lightboxDifferences.length}`,
        `- visual failing tiles: ${item.visual.filter((entry) => !entry.sameDimensions || entry.changedRatio > regressionPixelRatio).length}`,
        `- new horizontal overflow: ${item.horizontalOverflowRegression}`,
        `- interaction regression: ${item.interactionRegression}`,
        "",
      ])
    : ["None.", ""]),
].join("\n");
await writeFile(path.join(outputDir, "report.md"), `${markdown}\n`);

if (failures.length > 0) throw new Error(`CSS regression audit found ${failures.length} failing case/coverage record(s)`);
console.log(`CSS regression audit passed ${cases.length}/${cases.length} cases with ${requiredCoverage.length}/${requiredCoverage.length} required selector families covered.`);
