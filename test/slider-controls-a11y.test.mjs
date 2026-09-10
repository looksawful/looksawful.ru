import assert from "node:assert/strict";
import test from "node:test";

import { renderMediaSlider } from "../src/templates/media-slider.ts";
import { renderMockupDeck } from "../src/templates/mockup-deck.ts";

const imageEntry = "styx-06-source-01-1920x913-use-01";
const secondImageEntry = "styx-06-source-02-1920x917-use-01";

function assertGroupedSliderControls(html, label) {
  assert.match(
    html,
    /<div(?=[^>]*\bclass="slider-controls cluster")(?=[^>]*\baria-label="Навигация по слайдам")(?=[^>]*\brole="group")[^>]*>/,
    `${label} slider controls must expose one named group`,
  );
  assert.match(html, /<button aria-label="Предыдущий кадр" class="slider-controls__button"/);
  assert.match(html, /<button aria-label="Следующий кадр" class="slider-controls__button"/);
}

test("media slider controls expose explicit group semantics", () => {
  const html = renderMediaSlider({
    captionView: "summary",
    slides: [
      { entryId: imageEntry, captionView: "summary" },
      { entryId: secondImageEntry, captionView: "summary" },
    ],
  });

  assertGroupedSliderControls(html, "media slider");
});

test("mockup deck controls expose explicit group semantics", () => {
  const html = renderMockupDeck({
    variant: "standard",
    captionView: "summary",
    device: "desktop",
    slides: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  });

  assertGroupedSliderControls(html, "mockup deck");
});
