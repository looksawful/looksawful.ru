import assert from "node:assert/strict";
import test from "node:test";

import { renderPageFlip } from "../src/components/content/index.ts";
import { sensetiqueDigitalFearPageFlip } from "../src/data/content/sensetique.ts";

test("page-flip production data is typed content, not inline HTML", () => {
  assert.equal(sensetiqueDigitalFearPageFlip.pages.length, 6);
  assert.deepEqual(
    sensetiqueDigitalFearPageFlip.pages.map((page) => page.index),
    [111, 112, 113, 114, 115, 116],
  );
  assert.equal(typeof sensetiqueDigitalFearPageFlip.credits.title, "string");
});

test("page-flip renderer preserves the existing runtime contract", () => {
  const html = renderPageFlip(sensetiqueDigitalFearPageFlip);

  assert.match(html, /class="page-flip" data-lightbox="off" data-page-flip=""/);
  assert.equal((html.match(/class="page-flip__page"/g) ?? []).length, 6);
  assert.equal((html.match(/data-density="soft"/g) ?? []).length, 6);
  assert.match(html, /data-page-flip-book=""/);
  assert.match(html, /data-page-flip-prev=""/);
  assert.match(html, /data-page-flip-next=""/);
  assert.match(html, /data-page-flip-count="">01 \/ 03/);
  assert.doesNotMatch(html, /(?:width|height)="[0-9]+"/);
});