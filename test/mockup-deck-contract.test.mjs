import assert from "node:assert/strict";
import test from "node:test";

import { sandsFeatureMockupDeck } from "../src/data/content/sands.ts";
import { styxSocialInstructionMockupDeck } from "../src/data/content/styx.ts";

const templateUrl = new URL("../src/templates/mockup-deck.ts", import.meta.url);

test("image-only mockup decks are typed production data", () => {
  assert.equal(styxSocialInstructionMockupDeck.variant, "standard");
  assert.equal(styxSocialInstructionMockupDeck.slides.length, 4);
  assert.equal(sandsFeatureMockupDeck.variant, "mobile-device");
  assert.equal(sandsFeatureMockupDeck.slides.length, 2);
});

test("standard mockup deck preserves mockup and media-deck contracts", async () => {
  const { renderMockupDeck } = await import(templateUrl);
  const html = renderMockupDeck(styxSocialInstructionMockupDeck);

  assert.match(html, /class="media mockup"/);
  assert.match(html, /data-device="mobile"/);
  assert.match(html, /data-mockup-theme="dark"/);
  assert.match(html, /--surface-bg: #121212/);
  assert.equal((html.match(/class="mockup__slide"/g) ?? []).length, 4);
  assert.equal((html.match(/data-slide-caption=""/g) ?? []).length, 4);
  assert.equal((html.match(/data-caption-view="lightbox-only"/g) ?? []).length, 4);
  assert.match(html, /01 \/ 04/);
});

test("mobile-device deck preserves phone shell and slide attributes", async () => {
  const { renderMockupDeck } = await import(templateUrl);
  const html = renderMockupDeck(sandsFeatureMockupDeck);

  assert.match(html, /class="media feature-layout__mockup"/);
  assert.match(html, /class="mobile-mockup"/);
  assert.match(html, /class="mobile-mockup__hardware cluster"/);
  assert.match(html, /class="mobile-mockup__slides pile"/);
  assert.equal((html.match(/data-slide=""/g) ?? []).length, 2);
  assert.match(html, /data-media-title=/);
  assert.doesNotMatch(html, /slider-controls/);
});
