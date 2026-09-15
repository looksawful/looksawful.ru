import assert from "node:assert/strict";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

function activeSlideIndex(source) {
  return source.evaluate((node) =>
    [...node.querySelectorAll("[data-slide]")]
      .findIndex((slide) => slide.hasAttribute("data-active")),
  );
}

function markActiveMedia(source) {
  return source.evaluate((node) => {
    node.querySelectorAll("[data-smoke-active-lightbox]")
      .forEach((media) => media.removeAttribute("data-smoke-active-lightbox"));
    const media = node.querySelector(
      "[data-slide][data-active] img, [data-slide][data-active] video",
    ) || node.querySelector("img, video");
    if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) {
      return false;
    }
    media.setAttribute("data-smoke-active-lightbox", "");
    return true;
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
    const before = await activeSlideIndex(source);
    assert.ok(before >= 0, "expected an active deck slide before navigation");

    await deck.locator("[data-deck-next]").click({ force: true });
    await page.waitForFunction(
      ({ selector, beforeIndex }) => {
        const sourceNode = document.querySelector(selector);
        if (!(sourceNode instanceof HTMLElement)) return false;
        const slides = [...sourceNode.querySelectorAll("[data-slide]")];
        return slides.findIndex((slide) => slide.hasAttribute("data-active")) !== beforeIndex;
      },
      { selector: "[data-media-deck] [data-lightbox-source]", beforeIndex: before },
    );

    const after = await activeSlideIndex(source);
    assert.ok(after >= 0 && after !== before, "Next must change the active deck slide");
    assert.equal(await markActiveMedia(source), true, "active deck media must be markable");

    await source.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(".pswp", { state: "attached", timeout: 3_000 });
    const selectedActiveMedia = await page.evaluate(() => {
      const pswp = window.pswp;
      const dataSource = pswp?.options?.dataSource;
      if (!pswp || !Array.isArray(dataSource)) return false;
      const item = dataSource[pswp.currIndex];
      return item?.element instanceof HTMLElement
        && item.element.hasAttribute("data-smoke-active-lightbox");
    });
    assert.equal(selectedActiveMedia, true, "lightbox must select the active deck media element");

    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".pswp"), null, {
      timeout: 3_000,
    });
    assert.equal(
      await source.evaluate((node) => document.activeElement === node),
      true,
      "Escape must restore focus to the lightbox source",
    );

    console.log("[smoke-media-lightbox] active deck media + focus restore: OK");
  } finally {
    await context.close();
  }
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime((runtime) => runMediaLightboxSmoke(runtime));
}
