import { runProjectCardGeometryContract } from "./project-card-geometry.mjs";
import { runQuickSmoke, runMediaSanity } from "./run-smoke.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

async function inspectImage(locator, label) {
  await locator.waitFor({ state: "attached", timeout: 10_000 });
  await locator.scrollIntoViewIfNeeded();
  const result = await locator.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) {
      return { ok: false, reason: "not-an-image" };
    }

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    let visibleLeft = Math.max(0, rect.left);
    let visibleTop = Math.max(0, rect.top);
    let visibleRight = Math.min(innerWidth, rect.right);
    let visibleBottom = Math.min(innerHeight, rect.bottom);
    let ancestor = element.parentElement;

    while (ancestor) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (ancestorStyle.display === "none" || ancestorStyle.visibility === "hidden") {
        visibleRight = visibleLeft;
        visibleBottom = visibleTop;
        break;
      }

      const clipsX = ["hidden", "clip", "scroll", "auto"].includes(ancestorStyle.overflowX);
      const clipsY = ["hidden", "clip", "scroll", "auto"].includes(ancestorStyle.overflowY);
      if (clipsX || clipsY) {
        const ancestorRect = ancestor.getBoundingClientRect();
        if (clipsX) {
          visibleLeft = Math.max(visibleLeft, ancestorRect.left);
          visibleRight = Math.min(visibleRight, ancestorRect.right);
        }
        if (clipsY) {
          visibleTop = Math.max(visibleTop, ancestorRect.top);
          visibleBottom = Math.min(visibleBottom, ancestorRect.bottom);
        }
      }

      ancestor = ancestor.parentElement;
    }

    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    return {
      ok: element.complete
        && element.naturalWidth > 0
        && element.naturalHeight > 0
        && rect.width > 0
        && rect.height > 0
        && visibleWidth > 0
        && visibleHeight > 0
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0,
      complete: element.complete,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      visibleWidth,
      visibleHeight,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      srcPrefix: element.currentSrc.slice(0, 64),
    };
  });

  console.log(`[jestei-filter-art] ${label}: ${JSON.stringify(result)}`);
  if (!result.ok) {
    throw new Error(`[jestei-filter-art] ${label} is not visibly rendered`);
  }
}

async function visibleLocators(locator) {
  const visible = [];
  for (let index = 0; index < await locator.count(); index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible()) visible.push(item);
  }
  return visible;
}

async function runJesteiFilterArtworkSanity({ browser, baseUrl }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      browserMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserMessages.push(`pageerror: ${error.message}`));

  try {
    await page.goto(new URL("/work/jestei-pool/", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const filter = page.locator("playlist-filter-workflow");
    await filter.waitFor({ state: "visible", timeout: 30_000 });

    const allStars = filter.locator(".rating-star img");
    const visibleStars = await visibleLocators(allStars);
    console.log(`[jestei-filter-art] rating stars: total=${await allStars.count()} visible=${visibleStars.length}`);
    if (visibleStars.length !== 5) {
      throw new Error(`[jestei-filter-art] expected 5 visible rating stars, found ${visibleStars.length}`);
    }
    for (let index = 0; index < visibleStars.length; index += 1) {
      await inspectImage(visibleStars[index], `visible rating star ${index + 1}`);
    }

    const allKeyArt = filter.locator("[data-key-art-image]");
    const visibleKeyArt = await visibleLocators(allKeyArt);
    console.log(`[jestei-filter-art] Camelot art: total=${await allKeyArt.count()} visible=${visibleKeyArt.length}`);
    if (visibleKeyArt.length !== 1) {
      throw new Error(`[jestei-filter-art] expected 1 visible Camelot key wheel, found ${visibleKeyArt.length}`);
    }
    await inspectImage(visibleKeyArt[0], "visible Camelot key wheel");

    const allKeyButtons = filter.locator(".key-button[data-action=\"key\"]");
    const visibleKeyButtons = await visibleLocators(allKeyButtons);
    if (visibleKeyButtons.length !== 1) {
      throw new Error(`[jestei-filter-art] expected 1 visible Camelot modal trigger, found ${visibleKeyButtons.length}`);
    }
    await visibleKeyButtons[0].scrollIntoViewIfNeeded();
    await visibleKeyButtons[0].click();
    const dialog = filter.locator("#playlist-filter-key-dialog");
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    console.log("[jestei-filter-art] Camelot modal trigger: OK");
  } catch (error) {
    if (browserMessages.length) {
      console.error(`[jestei-filter-art] browser messages:\n${browserMessages.join("\n")}`);
    }
    throw error;
  } finally {
    await page.close();
  }
}

export async function runProductionE2E({ browser, baseUrl }) {
  await runQuickSmoke({ browser, baseUrl, cvMode: "production" });
  await runMediaSanity({ browser, baseUrl });
  await runJesteiFilterArtworkSanity({ browser, baseUrl });
  await runProjectCardGeometryContract({ browser, baseUrl });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionE2E({ browser, baseUrl }));
}
