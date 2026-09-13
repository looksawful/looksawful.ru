import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderGalleryPage } from "../src/site/renderers/gallery-page.ts";

const pluginSource = await readFile(
  new URL("../src/site/build/site-pages-plugin.ts", import.meta.url),
  "utf8",
);
const galleryCss = await readFile(
  new URL("../src/styles/gallery.css", import.meta.url),
  "utf8",
);

const galleryPage = sitePages.find((page) => page.id === "gallery");
assert.ok(galleryPage && galleryPage.type === "gallery");

const html = renderGalleryPage(galleryPage);

test("Gallery renderer emits semantic build-time content inside the shared page shell", () => {
  assert.match(html, /<body[^>]*data-page-type="gallery"[^>]*>/);
  assert.match(html, /data-site-navigation/);
  assert.match(html, /<main>/);
  assert.match(html, /<section[^>]*data-gallery/);
  assert.match(html, /<h1[^>]*>gallery<\/h1>/);
});

test("Gallery renderer has one photo stream and no retired layer/filter UI", () => {
  assert.doesNotMatch(html, /data-gallery-layer-control/);
  assert.doesNotMatch(html, /data-gallery-layer-panel/);
  assert.doesNotMatch(html, /data-gallery-layer=/);
  assert.doesNotMatch(html, /\bproduction\b/i);
  assert.doesNotMatch(html, /data-gallery-sort|data-gallery-search/);
});

test("Gallery output keeps invisible series boundaries and intrinsic image geometry", () => {
  assert.match(html, /data-gallery-series=/);
  assert.match(html, /data-gallery-item-id=/);
  assert.match(html, /<img[^>]*\bwidth="\d+"[^>]*\bheight="\d+"/);
  assert.doesNotMatch(html, /gallery-series__title|data-gallery-series-title/);
});

test("Gallery CSS follows site typography and explicitly avoids masonry mechanics", () => {
  assert.match(galleryCss, /\.gallery__title\s*\{[\s\S]*font-size:\s*var\(--fs-800\)/);
  assert.match(galleryCss, /\.gallery__title\s*\{[\s\S]*font-weight:\s*var\(--fw-700\)/);
  assert.match(galleryCss, /\.gallery__title\s*\{[\s\S]*letter-spacing:\s*var\(--ls-heading\)/);
  assert.doesNotMatch(galleryCss, /column-count\s*:/);
  assert.doesNotMatch(galleryCss, /grid-auto-rows\s*:/);
  assert.doesNotMatch(galleryCss, /grid-row-end\s*:/);
  assert.doesNotMatch(galleryCss, /gallery-row-span/);
  assert.doesNotMatch(galleryCss, /data-gallery-layout-ready/);
});

test("Gallery build plugin owns the renderer instead of leaving the physical input untouched", () => {
  assert.match(pluginSource, /renderGalleryPage/);
  assert.match(pluginSource, /page\.renderer === "gallery"/);
});
