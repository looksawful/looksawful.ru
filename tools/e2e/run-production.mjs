import { runQuickSmoke, runMediaSanity } from "./run-smoke.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

async function inspectImage(locator, label) {
  await locator.waitFor({ state: "attached", timeout: 10_000 });
  const result = await locator.evaluate((element) => {
    if (!(element instanceof HTMLImageElement)) {
      return { ok: false, reason: "not-an-image" };
    }
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      ok: element.complete
        && element.naturalWidth > 0
        && element.naturalHeight > 0
        && rect.width > 0
        && rect.height > 0
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0,
      complete: element.complete,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      srcPrefix: element.currentSrc.slice(0, 64),
    };
  });

  if (!result.ok) {
    throw new Error(`[jestei-filter-art] ${label} is not visibly rendered: ${JSON.stringify(result)}`);
  }

  console.log(`[jestei-filter-art] ${label}: OK ${result.naturalWidth}x${result.naturalHeight}`);
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
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    const filter = page.locator("playlist-filter-workflow");
    await filter.waitFor({ state: "visible", timeout: 10_000 });

    const stars = filter.locator(".rating-star img");
    const starCount = await stars.count();
    if (starCount !== 5) {
      throw new Error(`[jestei-filter-art] expected 5 rating stars, found ${starCount}`);
    }
    for (let index = 0; index < starCount; index += 1) {
      await inspectImage(stars.nth(index), `rating star ${index + 1}`);
    }

    const keyArt = filter.locator("[data-key-art-image]");
    await inspectImage(keyArt, "Camelot key wheel");

    const keyButton = filter.locator(".key-button[data-action=\"key\"]");
    await keyButton.click();
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
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionE2E({ browser, baseUrl }));
}
