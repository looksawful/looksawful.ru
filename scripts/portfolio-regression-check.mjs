import { chromium } from "playwright";

const baseUrl = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:4173";

const routes = [
  "/",
  "/resume/",
  "/pets/berserk-timer/",
  "/pets/awful-cases/",
  "/pets/awful-audit/",
];

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const allowedConsoleFragments = [
  "WebGL",
  "THREE.WebGLRenderer",
  "GL_INVALID",
  "GPU stall",
];

const isAllowedConsoleError = (text) => allowedConsoleFragments.some((fragment) => text.includes(fragment));

const failures = [];
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const failedRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.trim());
    });

    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1400);

    if (route === "/") {
      for (const progress of [0.25, 0.5, 0.75, 0.95]) {
        await page.evaluate((scrollProgress) => {
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          window.scrollTo({ top: maxScroll * scrollProgress, behavior: "instant" });
        }, progress);
        await page.waitForTimeout(900);
      }

      const visibleAnimationIndexes = await page.locator("[data-animation]").evaluateAll((elements) =>
        elements
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              index,
              visible:
                rect.width > 1 &&
                rect.height > 1 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity) > 0,
            };
          })
          .filter((item) => item.visible)
          .map((item) => item.index),
      );
      for (const index of visibleAnimationIndexes) {
        await page.locator("[data-animation]").nth(index).scrollIntoViewIfNeeded();
        await page.waitForTimeout(900);
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(300);
    }

    const metrics = await page.evaluate(() => ({
      readyState: document.readyState,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      winWidth: window.innerWidth,
      imageCount: document.images.length,
      failedImages: [...document.images]
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      videoCount: document.querySelectorAll("video").length,
      canvasCount: document.querySelectorAll("canvas").length,
    }));

    if (!response || !response.ok()) {
      failures.push(`${viewport.name} ${route}: HTTP ${response?.status() ?? "missing response"}`);
    }

    if (metrics.docWidth > metrics.winWidth + 2 || metrics.bodyWidth > metrics.winWidth + 2) {
      failures.push(
        `${viewport.name} ${route}: horizontal overflow doc=${metrics.docWidth} body=${metrics.bodyWidth} win=${metrics.winWidth}`,
      );
    }

    for (const source of metrics.failedImages) {
      failures.push(`${viewport.name} ${route}: broken image ${source}`);
    }

    for (const request of failedRequests.filter((entry) => !entry.includes("net::ERR_ABORTED"))) {
      failures.push(`${viewport.name} ${route}: request failed ${request}`);
    }

    for (const error of consoleErrors.filter((entry) => !isAllowedConsoleError(entry))) {
      failures.push(`${viewport.name} ${route}: console error ${error}`);
    }

    console.log(
      JSON.stringify(
        {
          viewport: viewport.name,
          route,
          metrics,
        },
        null,
        2,
      ),
    );

    await page.close();
  }
}

await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
