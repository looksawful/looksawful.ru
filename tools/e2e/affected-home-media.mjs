import assert from "node:assert/strict";
import { waitForDocumentReady } from "./readiness.mjs";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

async function openHomepage({ browser, baseUrl }) {
  const context = await browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `/: HTTP ${response?.status()}`);
  await waitForDocumentReady(page);
  return { context, page };
}

async function verifyDeferredVideoLoadOwnership(runtime) {
  const context = await runtime.browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    const originalLoad = HTMLMediaElement.prototype.load;
    window.__deferredVideoLoadViolations = [];
    HTMLMediaElement.prototype.load = function patchedLoad(...args) {
      if (
        this instanceof HTMLVideoElement
        && this.hasAttribute("data-autoplay-deferred")
      ) {
        window.__deferredVideoLoadViolations.push(
          this.dataset.autoplaySrc
            || this.querySelector("source[data-autoplay-src]")?.dataset.autoplaySrc
            || "<deferred-video>",
        );
      }
      return originalLoad.apply(this, args);
    };
  });

  const page = await context.newPage();
  try {
    const response = await page.goto(runtime.baseUrl, { waitUntil: "domcontentloaded" });
    assert.ok(response?.ok(), `/: HTTP ${response?.status()}`);
    await waitForDocumentReady(page);
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));

    const violations = await page.evaluate(() => window.__deferredVideoLoadViolations ?? []);
    assert.deepEqual(
      violations,
      [],
      "Deferred Homepage videos must only be loaded after source hydration",
    );
  } finally {
    await context.close();
  }
}

async function verifyHomepageVideoPosterFallback(runtime) {
  const context = await runtime.browser.newContext({
    viewport: DESKTOP_VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const targets = [
    "/media/projects/jestei/landings/moves-awful/source/01-2044x1112.mp4",
    "/media/projects/styx/01/source/04-9x16.mp4",
  ];

  try {
    for (const target of targets) {
      await page.route(`**${target}`, (route) =>
        route.fulfill({
          status: 500,
          contentType: "text/plain",
          body: "forced media failure",
        }),
      );
    }

    const response = await page.goto(runtime.baseUrl, { waitUntil: "domcontentloaded" });
    assert.ok(response?.ok(), `/: HTTP ${response?.status()}`);
    await waitForDocumentReady(page);

    for (const target of targets) {
      const video = page.locator([
        `video[data-autoplay-src*="${target}"]`,
        `video:has(source[data-autoplay-src*="${target}"])`,
        `video[src*="${target}"]`,
        `video:has(source[src*="${target}"])`,
      ].join(", ")).first();

      assert.equal(await video.count(), 1, `Homepage video fixture missing: ${target}`);
      const handle = await video.elementHandle();
      assert.ok(handle, `Homepage video handle missing: ${target}`);

      await video.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (node) => node.hasAttribute("data-media-video-fallback") || Boolean(node.error),
        handle,
        { timeout: 8_000 },
      );

      const state = await handle.evaluate((node) => ({
        fallback: node.hasAttribute("data-media-video-fallback"),
        poster: node.poster,
        error: node.error?.message ?? null,
      }));

      assert.equal(state.fallback, true, `Homepage video did not enter poster fallback: ${target}`);
      assert.ok(state.poster, `Homepage video fallback has no poster: ${target}`);
      assert.equal(state.error, null, `Homepage video leaked native MediaError after fallback: ${target}`);
    }
  } finally {
    await context.close();
  }
}

async function verifyHomepageVideoPlayback(runtime) {
  const { context, page } = await openHomepage(runtime);
  try {
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));

    const prematureDeferredErrors = await page.evaluate(() =>
      [...document.querySelectorAll("video[data-autoplay-deferred]")].flatMap((video) =>
        video.error
          ? [{
              src: video.dataset.autoplaySrc
                || video.querySelector("source[data-autoplay-src]")?.dataset.autoplaySrc
                || "<deferred-video>",
              code: video.error.code,
              message: video.error.message,
            }]
          : [],
      ),
    );
    assert.deepEqual(
      prematureDeferredErrors,
      [],
      "Deferred Homepage videos must not enter MediaError before source hydration",
    );

    const handles = await page.locator("video").elementHandles();
    const visibleVideos = [];
    for (const handle of handles) {
      const visible = await handle.evaluate((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && rect.width > 0
          && rect.height > 0;
      });
      if (visible) visibleVideos.push(handle);
    }
    assert.ok(visibleVideos.length > 0, "Homepage must expose at least one visible video for runtime smoke");

    for (const video of visibleVideos) {
      await video.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (node) => Boolean(
          node.error
          || (node.readyState >= HTMLMediaElement.HAVE_METADATA && node.videoWidth > 0 && node.videoHeight > 0),
        ),
        video,
        { timeout: 8_000 },
      );

      const state = await video.evaluate((node) => ({
        src: node.currentSrc || node.src || node.querySelector("source")?.src || "<missing-src>",
        error: node.error?.message ?? null,
        readyState: node.readyState,
        width: node.videoWidth,
        height: node.videoHeight,
      }));

      assert.equal(state.error, null, `Homepage video failed: ${state.src}`);
      assert.ok(
        state.readyState >= 1 && state.width > 0 && state.height > 0,
        `Homepage video metadata unavailable: ${state.src}`,
      );
    }
  } finally {
    await context.close();
  }
}

export async function runHomepageMediaAffected(runtime) {
  await verifyDeferredVideoLoadOwnership(runtime);
  await verifyHomepageVideoPosterFallback(runtime);
  await verifyHomepageVideoPlayback(runtime);
}
