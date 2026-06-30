import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (_) {
    const bundledNodeModules = path.join(
      process.env.USERPROFILE || "C:\\Users\\awful",
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules",
    );
    return createRequire(path.join(bundledNodeModules, "noop.js"))("playwright");
  }
}

const { chromium } = loadPlaywright();

const BASE_URL = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:5174";
const MOBILE = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function isVisible(page, selector) {
  return page.locator(selector).first().isVisible().catch(() => false);
}

async function waitForApp(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(700);
}

async function checkShowcase(page) {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/`);
  await waitForApp(page);

  const firstMedia = page.locator("#showcase a.media-item[data-lightbox-item][href]").first();
  await firstMedia.scrollIntoViewIfNeeded();
  await firstMedia.click({ force: true });
  await page.waitForSelector(".lightbox.is-open");
  await page.waitForSelector(".lightbox__body :is(img, video)", { timeout: 5000 });

  for (const viewport of [MOBILE, LANDSCAPE]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);

    const lightbox = await page.locator(".lightbox__dialog").boundingBox();
    const media = await page.locator(".lightbox__body :is(img, video)").first().boundingBox();
    assert(lightbox, "lightbox dialog is missing");
    assert(media, "lightbox media is missing");

    const dialogCenterX = lightbox.x + lightbox.width / 2;
    const dialogCenterY = lightbox.y + lightbox.height / 2;
    assert(Math.abs(dialogCenterX - viewport.width / 2) < 4, "lightbox is not centered horizontally");
    assert(Math.abs(dialogCenterY - viewport.height / 2) < 16, "lightbox is not centered vertically");
    assert(media.width <= viewport.width + 1, "lightbox media overflows viewport width");
    assert(media.height <= viewport.height + 1, "lightbox media overflows viewport height");
  }

  await page.keyboard.press("Escape");
  await page.setViewportSize(MOBILE);

  const heading = page.locator("#showcase .case-chapter-heading").first();
  await heading.scrollIntoViewIfNeeded();
  const headingMetrics = await heading.evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      textAlign: style.textAlign,
      whiteSpace: style.whiteSpace,
      width: rect.width,
      left: rect.left,
      right: rect.right,
    };
  });
  assert(headingMetrics.textAlign === "center", "mobile chapter heading is not centered");
  assert(headingMetrics.whiteSpace === "nowrap", "mobile chapter heading can wrap");
  assert(headingMetrics.left >= -1 && headingMetrics.right <= MOBILE.width + 1, "mobile chapter heading overflows viewport");

  const nonLogoItalicCount = await page.$$eval(
    "#showcase .case-chapter-heading__accent",
    (nodes) =>
      nodes.filter((node) => !node.closest("#jestei-frame-провели-ребрендинг") && getComputedStyle(node).fontStyle !== "normal")
        .length,
  );
  assert(nonLogoItalicCount === 0, "heading italics must be limited to the logo chapter");

  const facts = page.locator("#showcase .project-facts").first();
  await facts.scrollIntoViewIfNeeded();
  const factsMetrics = await facts.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    overflowX: getComputedStyle(node).overflowX,
  }));
  assert(factsMetrics.scrollWidth > factsMetrics.clientWidth + 8, "mobile facts are not horizontally scrollable");
  assert(factsMetrics.overflowX === "auto" || factsMetrics.overflowX === "scroll", "mobile facts overflow-x is not scrollable");

  const tocMetrics = await page.locator(".portfolio-toc").evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      position: style.position,
      width: rect.width,
      height: rect.height,
      right: window.innerWidth - rect.right,
      pointerEvents: style.pointerEvents,
    };
  });
  assert(tocMetrics.position === "fixed", "mobile TOC is not fixed to the side");
  assert(tocMetrics.width > 20 && tocMetrics.height > 20, "mobile TOC is too small or hidden");
  assert(tocMetrics.right >= 0 && tocMetrics.right < 24, "mobile TOC is not placed on the side");
  assert(tocMetrics.pointerEvents !== "none", "mobile TOC is not clickable");

  const filter = page.locator("#showcase .interface-section__filter .filter-fullscreen-wrapper").first();
  await filter.scrollIntoViewIfNeeded();
  const filterMetrics = await filter.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { height: rect.height, width: rect.width, overflow: getComputedStyle(node).overflow };
  });
  assert(filterMetrics.width <= MOBILE.width + 1, "mobile filter wrapper overflows the viewport");
  assert(filterMetrics.height >= 220 && filterMetrics.height <= 520, "mobile filter wrapper height is cropped or leaves too much empty space");

  const tokenMetrics = await page
    .locator("#jestei-frame-добавили-цвет .content-section--tokens")
    .evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, overflowX: getComputedStyle(node).overflowX }));
  assert(tokenMetrics.scrollWidth > tokenMetrics.clientWidth + 8, "mobile color token section is not scrollable");
  assert(tokenMetrics.overflowX === "auto" || tokenMetrics.overflowX === "scroll", "mobile color token section overflow-x is not scrollable");

  assert(!(await isVisible(page, "#pet-slide-awful-describer")), "Awful Describer preview is still visible");
  assert(!(await isVisible(page, "#project-shootings .project-skill-cloud")), "shootings chips are still visible");
  assert((await page.locator("#showcase .showcase-video-controls").count()) === 0, "custom video control artifacts are still mounted");

  const policyBook = page.locator("[data-policy-book]").first();
  await policyBook.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const policyViewport = page.locator("[data-policy-viewport]").first();
  const beforePolicyPage = await page.locator("[data-policy-current]").first().textContent();
  const policyBox = await policyViewport.boundingBox();
  assert(policyBox, "policy book viewport is missing");
  await page.mouse.move(policyBox.x + policyBox.width * 0.82, policyBox.y + policyBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(policyBox.x + policyBox.width * 0.18, policyBox.y + policyBox.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const afterPolicyPage = await page.locator("[data-policy-current]").first().textContent();
  assert(beforePolicyPage !== afterPolicyPage, "policy book swipe did not switch pages");

  const beforeAfter = page.locator("#project-jestei-color-before-after");
  await beforeAfter.scrollIntoViewIfNeeded();
  await page.waitForSelector("#project-jestei-color-before-after[data-before-after-mounted='true']", { timeout: 5000 });
  await page.waitForTimeout(700);

  const beforeAfterBox = await beforeAfter.boundingBox();
  assert(beforeAfterBox, "before/after canvas is missing");

  const dragBeforeAfter = async (ratio) => {
    await page.mouse.move(
      beforeAfterBox.x + beforeAfterBox.width * 0.5,
      beforeAfterBox.y + beforeAfterBox.height * 0.5,
    );
    await page.mouse.down();
    await page.mouse.move(beforeAfterBox.x + beforeAfterBox.width * ratio, beforeAfterBox.y + beforeAfterBox.height * 0.5, {
      steps: 8,
    });
    await page.mouse.up();
    await page.waitForTimeout(120);

    return beforeAfter.evaluate((node) => node.toDataURL("image/png").slice(0, 4000));
  };

  const beforeAfterLeft = await dragBeforeAfter(0.18);
  const beforeAfterRight = await dragBeforeAfter(0.82);
  assert(beforeAfterLeft !== beforeAfterRight, "before/after drag did not update the canvas");
}

async function checkGallery(page) {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/gallery/`);
  await waitForApp(page);
  await page.waitForSelector("[data-asset-card]", { timeout: 5000 });

  assert((await page.locator("[data-asset-card][data-type='video']").count()) === 0, "gallery should show photos only");
  assert(!(await isVisible(page, ".asset-controls")), "gallery filter chips are still visible");
  assert((await page.locator("[data-sort-value]").count()) === 0, "gallery sort chips are still visible");
  assert(!(await isVisible(page, ".asset-card__body")), "gallery card captions/tags are still visible");
  assert(!(await isVisible(page, "[data-filter-tags]")), "gallery active tag labels are still visible");
}

async function checkAwfulCases(page) {
  await page.setViewportSize(MOBILE);
  await page.goto(`${BASE_URL}/pets/awful-cases/`);
  await waitForApp(page);

  const frame = page.frameLocator(".runner-frame");
  await frame.locator("#startButton").waitFor({ timeout: 5000 });
  assert(await frame.locator(".mobile-controls").isVisible(), "mobile game controls are missing");

  const buttons = await frame.locator("[data-mobile-action]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-mobile-action")));
  assert(["upper", "lower", "toggle", "title"].every((action) => buttons.includes(action)), "mobile game controls do not cover all operations");
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await checkShowcase(page);
    await checkGallery(page);
    await checkAwfulCases(page);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
