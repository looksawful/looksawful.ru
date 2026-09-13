import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderGalleryPage } from "../src/site/renderers/gallery-page.ts";

const pluginSource = await readFile(
  new URL("../src/site/build/site-pages-plugin.ts", import.meta.url),
  "utf8",
);

const galleryPage = sitePages.find((page) => page.id === "gallery");
assert.ok(galleryPage && galleryPage.type === "gallery");

const html = renderGalleryPage(galleryPage);

function matches(source, pattern) {
  return [...source.matchAll(pattern)];
}

test("Gallery renderer emits semantic build-time content inside the shared page shell", () => {
  assert.match(html, /<body[^>]*data-page-type="gallery"[^>]*>/);
  assert.match(html, /data-site-navigation/);
  assert.match(html, /<main>/);
  assert.match(html, /<section[^>]*data-gallery/);
  assert.match(html, /<h1[^>]*>gallery<\/h1>/);
});

test("Gallery public controls expose exactly photography and production", () => {
  const controls = matches(html, /data-gallery-layer-control="([^"]+)"/g)
    .map((match) => match[1]);
  assert.deepEqual(controls, ["photography", "production"]);
  assert.match(html, /data-gallery-layer-control="photography"[^>]*aria-pressed="true"/);
  assert.match(html, /data-gallery-layer-control="production"[^>]*aria-pressed="false"/);
  assert.doesNotMatch(html, /data-gallery-layer-control="all"/);
  assert.doesNotMatch(html, /data-gallery-sort|data-gallery-search/);
});

test("Gallery output keeps invisible series boundaries and intrinsic image geometry", () => {
  assert.match(html, /data-gallery-series=/);
  assert.match(html, /data-gallery-item-id=/);
  assert.match(html, /<img[^>]*\bwidth="\d+"[^>]*\bheight="\d+"/);
  assert.doesNotMatch(html, /gallery-series__title|data-gallery-series-title/);
});

test("Gallery build plugin owns the renderer instead of leaving the physical input untouched", () => {
  assert.match(pluginSource, /renderGalleryPage/);
  assert.match(pluginSource, /page\.renderer === "gallery"/);
});
