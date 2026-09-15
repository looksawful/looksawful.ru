import assert from "node:assert/strict";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runMediaDeckSmoke({ browser, baseUrl }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const deck = page.locator("[data-media-deck]:has([data-deck-track]):has([data-deck-next])").first();
    assert.equal(await deck.count(), 1, "expected a production media deck");
    await deck.evaluate((node) => {
      const hiddenOwner = node.closest("[hidden]");
      if (hiddenOwner instanceof HTMLElement) hiddenOwner.hidden = false;
    });
    await deck.waitFor({ state: "visible" });
    await deck.scrollIntoViewIfNeeded();

    const snapshot = () => deck.evaluate((node) => {
      const dots = [...node.querySelectorAll("[data-deck-dot]")];
      return {
        slides: node.querySelectorAll("[data-slide]").length,
        dots: dots.length,
        selected: dots.findIndex((dot) => dot.getAttribute("aria-current") === "true"),
      };
    });
    const waitForSelected = async (index) => {
      const deadline = Date.now() + 3_000;
      while (Date.now() < deadline) {
        if ((await snapshot()).selected === index) return;
        await page.waitForTimeout(25);
      }
      assert.equal(
        (await snapshot()).selected,
        index,
        `deck must select slide ${index + 1}`,
      );
    };

    const initial = await snapshot();
    assert.ok(initial.slides > 1 && initial.dots === initial.slides, "deck must expose one dot per slide");
    assert.equal(initial.selected, 0, "deck must start on the first slide");
    await deck.locator("[data-deck-next]").click({ force: true });
    await waitForSelected(1);
    assert.equal((await snapshot()).selected, 1, "Next must select the second slide");

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(200);
    assert.equal((await snapshot()).selected, 1, "resize/reInit must preserve the selected slide");

    await deck.locator("[data-deck-dot]").first().click({ force: true });
    await waitForSelected(0);
    assert.equal((await snapshot()).selected, 0, "dot navigation must return to the first slide");

    console.log("[smoke-media-deck] next + resize/reInit + dot navigation: OK");
  } finally {
    await context.close();
  }
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime((runtime) => runMediaDeckSmoke(runtime));
}
