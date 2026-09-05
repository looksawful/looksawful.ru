import assert from "node:assert/strict";
import { getExpectedCvCardCount, getExpectedCvHiddenCards } from "../smoke-cv.mjs";
import { mapWithConcurrency } from "./concurrency.mjs";
import { waitForDocumentReady, waitForLightboxClosed } from "./readiness.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

async function assertBasicAccessibility(page, route) {
  const violations = await page.evaluate(() => {
    const issues = [];
    const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const describe = (node) => {
      const id = node.id ? `#${node.id}` : "";
      const classes = [...node.classList].slice(0, 2).map((name) => `.${name}`).join("");
      return `${node.tagName.toLowerCase()}${id}${classes}`;
    };
    const isVisible = (node) => {
      if (node.hidden || node.closest('[hidden], [aria-hidden="true"]')) return false;
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const ariaLabelledBy = (node) => normalize(
      (node.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" "),
    );
    const sharedName = (node) => [
      node.getAttribute("aria-label"),
      ariaLabelledBy(node),
      node.getAttribute("title"),
    ].some((value) => normalize(value));
    const nativeControlName = (node) => {
      if (sharedName(node)) return true;
      if ("labels" in node && [...(node.labels ?? [])].some((label) => normalize(label.textContent))) return true;
      if (node instanceof HTMLInputElement && /^(button|submit|reset|image)$/i.test(node.type)) {
        return Boolean(normalize(node.value) || normalize(node.alt));
      }
      return false;
    };
    const textControlName = (node) => {
      if (sharedName(node) || normalize(node.textContent)) return true;
      return [...node.querySelectorAll("img[alt]")].some((image) => normalize(image.getAttribute("alt")));
    };

    const ids = new Map();
    for (const node of document.querySelectorAll("[id]")) {
      if (!node.id) continue;
      const count = (ids.get(node.id) ?? 0) + 1;
      ids.set(node.id, count);
    }
    for (const [id, count] of ids) {
      if (count > 1) issues.push(`duplicate id #${id} (${count})`);
    }

    for (const image of document.querySelectorAll("img")) {
      if (!image.hasAttribute("alt")) issues.push(`${describe(image)} missing alt attribute`);
    }

    const mains = document.querySelectorAll("main");
    if (mains.length !== 1) issues.push(`expected exactly one main, found ${mains.length}`);
    const headings = document.querySelectorAll("h1");
    if (headings.length !== 1) issues.push(`expected exactly one h1, found ${headings.length}`);

    for (const node of document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="tab"]')) {
      if (!isVisible(node)) continue;
      const isNativeFormControl = /^(INPUT|SELECT|TEXTAREA)$/.test(node.tagName);
      const named = isNativeFormControl ? nativeControlName(node) : textControlName(node);
      if (!named) issues.push(`${describe(node)} has no accessible name`);
    }

    return [...new Set(issues)].sort();
  });

  assert.deepEqual(violations, [], `${route}: basic accessibility violations`);
}

async function audit({ browser, baseUrl }, route, viewport, verify) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width === 390, hasTouch: viewport.width === 390, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).origin === baseUrl && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).origin === baseUrl && request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(`${request.failure()?.errorText}: ${request.url()}`);
  });
  try {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    assert.ok(response?.ok(), `${route}: HTTP ${response?.status()}`);
    await waitForDocumentReady(page);
    await assertBasicAccessibility(page, route);
    await verify(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), `${route} ${viewport.width}: document overflow`);
    assert.deepEqual(errors, [], `${route}: fatal page/resource errors`);
    console.log(`[quick-smoke] ${route} ${viewport.width}x${viewport.height}: OK`);
  } finally { await context.close(); }
}

async function verifyBuiltAssets(page) {
  const assets = await page.evaluate(() => ({
    scripts: [...document.scripts].map((node) => node.getAttribute("src")).filter(Boolean),
    styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.getAttribute("href")),
  }));
  assert.ok(assets.scripts.some((src) => /^\/assets\/.+\.js$/.test(src)), "missing built JS");
  assert.ok(assets.styles.some((src) => /^\/assets\/.+\.css$/.test(src)), "missing built CSS");
  assert.ok(![...assets.scripts, ...assets.styles].some((src) => /(?:^|\/)src\//.test(src)), "raw src URL in artifact");
  for (const src of [...assets.scripts, ...assets.styles].filter((src) => src.startsWith("/assets/"))) {
    const response = await page.request.get(new URL(src, page.url()).href);
    assert.ok(response.ok(), `built asset unavailable: ${src}`);
    assert.ok((await response.body()).length > 0, `empty built asset: ${src}`);
  }
}

async function verifyNavigation(page) {
  const toggle = page.locator("[data-site-menu-toggle]");
  await toggle.click();
  await page.waitForFunction(() => document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded") === "true" && document.querySelector("[data-site-menu]")?.hidden === false);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("[data-site-menu-toggle]")?.getAttribute("aria-expanded") === "false" && document.querySelector("[data-site-menu]")?.hidden === true);
}

async function verifyImage(page) {
  const image = page.locator("img:visible").first();
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(async (node) => { await node.decode(); if (!node.naturalWidth) throw new Error("image decode failed"); });
}

async function verifyCase(page) {
  assert.equal(await page.locator("body").getAttribute("data-page-type"), "case");
  await verifyImage(page);
  const source = page.locator("[data-lightbox-source]:visible").first();
  if (await source.count()) {
    await source.scrollIntoViewIfNeeded();
    await source.click({ force: true });
    await page.waitForFunction(() => window.pswp?.opener?.isOpen === true || document.querySelector("[data-media-lightbox][open]"));
    await page.keyboard.press("Escape");
    await waitForLightboxClosed(page);
  }
}

async function verifyCanvas(page) {
  await page.locator("[data-animated-canvas-gallery]").first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const gallery = document.querySelector("[data-animated-canvas-gallery]");
    const canvas = gallery?.querySelector("canvas");
    return gallery?.dataset.galleryState === "error" || (canvas?.width > 2 && canvas?.height > 2 && canvas.getBoundingClientRect().width > 2);
  });
  assert.notEqual(await page.locator("[data-animated-canvas-gallery]").first().getAttribute("data-gallery-state"), "error");
}

export async function runQuickSmoke({ browser, baseUrl, cvMode = "authored" }) {
  const runtime = { browser, baseUrl };
  // These are the only parallel contexts; callers run quick smoke before deep suites.
  await mapWithConcurrency(VIEWPORTS, 2, (viewport) => audit(runtime, "/", viewport, async (page) => {
    await verifyBuiltAssets(page);
    await verifyNavigation(page);
    await verifyImage(page);
  }));
  await mapWithConcurrency([
    ["/work/jestei-pool/", verifyCase],
    ["/work/moves-awful/", verifyCanvas],
  ], 2, ([route, verify]) => audit(runtime, route, VIEWPORTS[1], verify));
  await audit(runtime, "/cv/", VIEWPORTS[1], async (page) => {
    assert.equal(await page.locator("main.resume").count(), 1);
    assert.equal(await page.locator(".experience-card").count(), getExpectedCvCardCount(cvMode));
    assert.equal(await page.locator(".experience-card[hidden]").count(), getExpectedCvHiddenCards(cvMode));
    if (cvMode === "production") {
      assert.equal(
        await page.locator("script[data-static-site-analytics]").count(),
        1,
        "Production CV must include exactly one isolated analytics bootstrap",
      );
      assert.equal(
        await page.locator('script[src="/src/main.js"], script[src^="/assets/main-"]').count(),
        0,
        "Production CV must not load the site application runtime",
      );
      assert.equal(
        await page.locator('script[data-site-analytics="yandex"]').count(),
        0,
        "Yandex Metrica must remain unloaded before analytics consent",
      );
    } else {
      assert.equal(await page.locator("script").count(), 0, "Authored CV must remain script-free");
    }
    assert.equal(await page.locator(".resume-nav__back").getAttribute("href"), "/");
  });
}

export async function runMediaSanity({ browser, baseUrl }) {
  await audit({ browser, baseUrl }, "/work/sensetique/", VIEWPORTS[1], async (page) => {
    const video = page.locator('video:has(source[src*=".web.mp4"]), video[src*=".web.mp4"]').first();
    assert.ok(await video.count(), "production delivery video missing");
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((node) => { node.preload = "metadata"; node.load(); });
    await page.waitForFunction(() => {
      const video = document.querySelector('video:has(source[src*=".web.mp4"]), video[src*=".web.mp4"]');
      return video?.error || (video?.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0);
    });
    assert.equal(await video.evaluate((node) => node.error?.message ?? null), null);
  });
}

if (isDirectExecution(import.meta.url)) await withE2ERuntime(runQuickSmoke);
