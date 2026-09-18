import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderAnimatedCanvasGallery } from "../src/templates/animated-canvas-gallery.ts";
import { renderBeforeAfter } from "../src/templates/before-after.ts";
import { renderJustifiedGallery } from "../src/templates/justified-gallery.ts";
import { renderMediaFigure } from "../src/templates/media-figure.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";
import { renderMediaSlider } from "../src/templates/media-slider.ts";
import { renderMockup } from "../src/templates/mockup.ts";
import { renderMockupDeck } from "../src/templates/mockup-deck.ts";
import { renderPageFlip } from "../src/templates/page-flip.ts";

const imageEntry = "styx-06-source-01-1920x913-use-01";
const secondImageEntry = "styx-06-source-02-1920x917-use-01";
const hidden = { showEditorialCopy: false };

function assertNoEditorialCopy(html, label) {
  assert.doesNotMatch(html, /media__caption|media-group__head|class="credits"|data-media-title|data-media-credits/, label);
}

test("media figure suppresses captions natively while keeping media", () => {
  const normal = renderMediaFigure({ entryId: imageEntry, captionView: "summary" });
  assert.match(normal, /media__caption/);
  const html = renderMediaFigure({ entryId: imageEntry, captionView: "summary" }, hidden);
  assertNoEditorialCopy(html, "media figure");
  assert.match(html, /<img\b/);
});

test("media group suppresses head and child captions natively", () => {
  const html = renderMediaGroup({
    layout: "grid",
    captionView: "summary",
    head: { credits: { title: "Credits" }, note: { kind: "group", text: "Note" } },
    items: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  }, hidden);
  assertNoEditorialCopy(html, "media group");
  assert.equal((html.match(/<img\b/g) ?? []).length, 2);
});

test("mockup and mockup deck suppress captions but retain interactive controls", () => {
  const mockup = renderMockup({ entryId: imageEntry, captionView: "summary", device: "desktop" }, hidden);
  assertNoEditorialCopy(mockup, "mockup");
  assert.match(mockup, /mockup__viewport/);

  const deck = renderMockupDeck({
    variant: "standard",
    captionView: "summary",
    device: "desktop",
    slides: [{ entryId: imageEntry }, { entryId: secondImageEntry }],
  }, hidden);
  assertNoEditorialCopy(deck, "mockup deck");
  assert.match(deck, /slider-controls__button/);
});

test("slider and justified gallery suppress captions without losing controls or media", () => {
  const slider = renderMediaSlider({
    captionView: "summary",
    slides: [
      { entryId: imageEntry, captionView: "summary" },
      { entryId: secondImageEntry, captionView: "summary" },
    ],
  }, hidden);
  assertNoEditorialCopy(slider, "slider");
  assert.match(slider, /slider-controls__count/);

  const gallery = renderJustifiedGallery({
    captionView: "summary",
    rows: [{ kind: "landscape", items: [{ entryId: imageEntry }, { entryId: secondImageEntry }] }],
  }, hidden);
  assertNoEditorialCopy(gallery, "justified gallery");
  assert.equal((gallery.match(/<img\b/g) ?? []).length, 2);
});

test("before-after and page flip suppress editorial copy but keep accessible controls", () => {
  const comparison = renderBeforeAfter({
    captionView: "summary",
    caption: { title: "Comparison", text: "Editorial copy" },
    before: { entryId: imageEntry, label: "Before" },
    after: { entryId: secondImageEntry, label: "After" },
  }, hidden);
  assertNoEditorialCopy(comparison, "before-after");
  assert.match(comparison, /aria-label="Сравнить изображение до и после"/);
  assert.match(comparison, />Before</);
  assert.match(comparison, />After</);

  const flip = renderPageFlip({
    credits: { title: "Credits", lines: ["Line"] },
    pages: [{ entryId: imageEntry, index: 1 }, { entryId: secondImageEntry, index: 2 }],
  }, hidden);
  assertNoEditorialCopy(flip, "page flip");
  assert.match(flip, /aria-label="Назад"/);
  assert.match(flip, /aria-label="Вперёд"/);
});

test("animated canvas gallery suppresses authored title/credit metadata but keeps aria label", () => {
  const html = renderAnimatedCanvasGallery({
    profile: "production",
    variant: "masonry",
    ariaLabel: "Canvas gallery",
    sources: [{ entryId: imageEntry, mediaTitle: "Title", mediaCredits: "Credits" }],
  }, hidden);
  assertNoEditorialCopy(html, "animated canvas gallery");
  assert.match(html, /aria-label="Canvas gallery"/);
  assert.match(html, /data-masonry-source/);
});

test("generic content-block renderer no longer strips rendered HTML with caption regexes", async () => {
  const source = await readFile(new URL("../src/site/renderers/entity/content-block.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /stripFigureCaptions|stripMediaGroupHead|renderCaptionless/);
});
