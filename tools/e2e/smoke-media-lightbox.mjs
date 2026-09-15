import assert from "node:assert/strict";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

function activeMediaUrl(source) {
  return source.evaluate((node) => {
    const media = node.querySelector(
      "[data-slide][data-active] img, [data-slide][data-active] video",
    ) || node.querySelector("img, video");

    if (media instanceof HTMLImageElement) return media.currentSrc || media.src;
    if (media instanceof HTMLVideoElement) return media.currentSrc || media.src;
    return "";
  });
}

export async function runMediaLightboxSmoke({ browser, baseUrl }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/work/sensetique/`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const deck = page.locator(
      "[data-media-deck]:has([data-deck-next]):has([data-lightbox-source])",
    ).first();
    assert.equal(await deck.count(), 1, "expected a production media deck");
    await deck.scrollIntoViewIfNeeded();

    const source = deck.locator("[data-lightbox-source]").first();
    const before = await activeMediaUrl(source);
    assert.ok(before, "expected an active media URL before navigation");

    await deck.locator("[data-deck-next]").click({ force: true });
    await page.waitForTimeout(350);

    const after = await activeMediaUrl(source);
    assert.ok(after && after !== before, "Next must change the active deck media");

    await source.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(".pswp", { state: "attached", timeout: 3_000 });
    const opened = await page.evaluate(() => {
      const image = document.querySelector(".pswp img.pswp__img");
      const video = document.querySelector(".pswp video");
      if (image instanceof HTMLImageElement) return image.currentSrc || image.src;
      if (video instanceof HTMLVideoElement) return video.currentSrc || video.src;
      return "";
    });
    assert.equal(opened, after, "lightbox must open the active deck slide");

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp"), null, {
      timeout: 3_000,
    });
    assert.equal(
      await source.evaluate((node) => document.activeElement === node),
      true,
      "Escape must restore focus to the lightbox source",
    );

    console.log("[smoke-media-lightbox] active deck slide + focus restore: OK");
  } finally {
    await context.close();
  }
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) =>
    runMediaLightboxSmoke({ browser, baseUrl }),
  );
}
