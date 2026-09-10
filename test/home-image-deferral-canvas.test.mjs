import assert from "node:assert/strict";
import test from "node:test";

import { deferHomepageLazyImages } from "../src/site/renderers/home/home-image-deferral.ts";

function openingTag(html, marker) {
  const match = html.match(new RegExp(`<img\\b[^>]*${marker}[^>]*>`, "i"));
  assert.ok(match, `missing image marker ${marker}`);
  return match[0];
}

test("homepage image deferral preserves runtime-owned production masonry sources", () => {
  const html = `<html><body>
<img alt="ordinary" src="/media/ordinary.webp">
<div data-gallery-fallback="" hidden="">
  <img alt="" data-masonry-source="" src="/media/gallery-source.webp">
</div>
</body></html>`;

  const rendered = deferHomepageLazyImages(html);
  const ordinary = openingTag(rendered, 'alt="ordinary"');
  const masonrySource = openingTag(rendered, 'data-masonry-source=""');

  assert.match(ordinary, /data-home-src="\/media\/ordinary\.webp"/);
  assert.match(ordinary, /data-home-image-deferred=""/);
  assert.doesNotMatch(ordinary, /\ssrc="\/media\/ordinary\.webp"/);

  assert.match(masonrySource, /\ssrc="\/media\/gallery-source\.webp"/);
  assert.doesNotMatch(masonrySource, /data-home-src=/);
  assert.doesNotMatch(masonrySource, /data-home-image-deferred=/);
});
