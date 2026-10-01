import assert from "node:assert/strict";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

async function verifyBerserkAudioSeek(page) {
  const player = page.locator("[data-berserk-audio-player]").first();
  assert.equal(await player.count(), 1, "expected Berserk audio player");

  await player.evaluate((node) => {
    const hiddenOwner = node.closest("[hidden]");
    if (hiddenOwner instanceof HTMLElement) hiddenOwner.hidden = false;
    const slide = node.closest("[data-slide]");
    if (slide instanceof HTMLElement) slide.setAttribute("data-active", "");
  });

  const seek = player.locator('input[data-audio-progress][type="range"]');
  assert.equal(await seek.count(), 1, "Berserk seek must be a native range");

  await player.locator("audio").evaluate((audio) => {
    let currentTime = 0;
    Object.defineProperty(audio, "duration", { configurable: true, value: 10 });
    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      get: () => currentTime,
      set: (value) => { currentTime = Number(value); },
    });
    audio.dispatchEvent(new Event("loadedmetadata"));
  });

  await seek.focus();
  await seek.press("ArrowRight");

  const state = await player.evaluate((node) => {
    const range = node.querySelector("[data-audio-progress]");
    const audio = node.querySelector("audio");
    const track = node.querySelector(".berserk-audio__progress");
    if (!(range instanceof HTMLInputElement) || !(audio instanceof HTMLAudioElement) || !(track instanceof HTMLElement)) {
      throw new Error("missing Berserk seek runtime");
    }
    return {
      value: Number(range.value),
      valueText: range.getAttribute("aria-valuetext"),
      audioTime: audio.currentTime,
      outlineWidth: getComputedStyle(track).outlineWidth,
    };
  });

  assert.equal(state.value, 1, "ArrowRight must advance native seek by one second");
  assert.equal(state.audioTime, 1, "keyboard seek must update audio.currentTime");
  assert.equal(state.valueText, "00:01", "seek must expose formatted current time");
  assert.equal(state.outlineWidth, "2px", "keyboard focus must remain visibly outlined");
}

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

    await verifyBerserkAudioSeek(page);
    console.log("[smoke-media-deck] next + resize/reInit + dot navigation + Berserk keyboard seek: OK");
  } finally {
    await context.close();
  }
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime((runtime) => runMediaDeckSmoke(runtime));
}
