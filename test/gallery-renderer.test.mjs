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
const mediaLightboxCss = await readFile(
  new URL("../src/styles/media-lightbox.css", import.meta.url),
  "utf8",
);
const lightboxSource = await readFile(
  new URL("../src/components/gallery/gallery-lightbox.ts", import.meta.url),
  "utf8",
);

const galleryPage = sitePages.find((page) => page.id === "gallery");
assert.ok(galleryPage && galleryPage.type === "gallery");

const html = renderGalleryPage(galleryPage);

test("Gallery renderer emits semantic build-time content inside the shared page shell without a page-level heading", () => {
  assert.match(html, /<body[^>]*data-page-type="gallery"[^>]*>/);
  assert.match(html, /data-site-navigation/);
  assert.match(html, /<main>/);
  assert.match(html, /<section[^>]*data-gallery/);
  assert.doesNotMatch(html, /<h1\b/i);
  assert.doesNotMatch(html, /gallery__header|gallery__title/);
});

test("Gallery renderer has one continuous mixed-media wall and no retired layer/filter UI", () => {
  assert.equal((html.match(/data-gallery-grid/g) ?? []).length, 1);
  assert.doesNotMatch(html, /data-gallery-series=/);
  assert.doesNotMatch(html, /data-gallery-layer-control/);
  assert.doesNotMatch(html, /data-gallery-layer-panel/);
  assert.doesNotMatch(html, /data-gallery-layer=/);
  assert.doesNotMatch(html, /data-gallery-sort|data-gallery-search/);
  assert.match(html, /data-gallery-kind="image"/);
  assert.match(html, /data-gallery-kind="video"/);
});

test("Gallery image and video cards preserve canonical intrinsic geometry", () => {
  assert.match(html, /data-gallery-item-id=/);
  assert.match(html, /<img[^>]*\bwidth="\d+"[^>]*\bheight="\d+"/);
  assert.match(html, /<video[^>]*data-gallery-video[^>]*muted[^>]*loop[^>]*playsinline[^>]*preload="metadata"/);
  assert.match(html, /<video[^>]*poster="\/media\//);

  const videoCards = [...html.matchAll(/<figure[^>]*data-gallery-kind="video"[\s\S]*?<\/figure>/g)]
    .map((match) => match[0]);
  assert.ok(videoCards.length > 0, "Gallery must render video cards");
  for (const card of videoCards) {
    assert.match(card, /data-gallery-src="[^"]+"/);
    assert.match(card, /data-gallery-poster="[^"]+"/);
    assert.match(card, /data-gallery-width="\d+"/);
    assert.match(card, /data-gallery-height="\d+"/);
    assert.match(card, /data-gallery-title=/);
    assert.match(card, /data-gallery-credits=/);
  }
});

test("Gallery image cards never expose an empty accessible label when canonical title exists", () => {
  const cards = [...html.matchAll(/<figure[^>]*data-gallery-kind="image"[\s\S]*?<\/figure>/g)].map((match) => match[0]);
  assert.ok(cards.length > 0, "Gallery must render image cards");

  for (const card of cards) {
    const title = card.match(/data-gallery-title="([^"]*)"/)?.[1] ?? "";
    const alt = card.match(/<img[^>]*\balt="([^"]*)"/)?.[1] ?? "";
    if (title.trim()) {
      assert.ok(alt.trim(), `Gallery card with title ${title} must have a non-empty image alt`);
    }
  }
});

test("Gallery exposes canonical credits to the PhotoSwipe caption adapter", () => {
  assert.match(html, /data-gallery-credits=/);
  assert.match(lightboxSource, /galleryCredits/);
  assert.match(lightboxSource, /captionHtml/);
});

test("Gallery PhotoSwipe credits stay readable over arbitrary media", () => {
  const captionRule = mediaLightboxCss.match(
    /\.media-lightbox--photoswipe \.media-lightbox__caption\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(captionRule, /color:\s*#fff\b/);
  assert.match(captionRule, /background:/);
  assert.match(captionRule, /padding:/);
});

test("Gallery mixed-media lightbox renders controlled video slides and pauses them across lifecycle changes", () => {
  assert.match(lightboxSource, /dataset\.galleryKind/);
  assert.match(lightboxSource, /dataset\.galleryPoster/);
  assert.match(lightboxSource, /escapeAttribute/);
  assert.match(lightboxSource, /gallery-lightbox__video/);
  assert.match(lightboxSource, /controls playsinline preload="metadata"/);
  assert.match(lightboxSource, /pauseViewerVideos/);
  assert.match(lightboxSource, /lightbox\.on\("change"/);
  assert.match(lightboxSource, /lightbox\.on\("close"/);
  assert.match(lightboxSource, /lightbox\.on\("destroy"/);
});

test("Gallery CSS is layout-neutral for InfiniteGrid and keeps equal gap ownership", () => {
  assert.doesNotMatch(galleryCss, /\.gallery__header\b/);
  assert.doesNotMatch(galleryCss, /\.gallery__title\b/);
  assert.doesNotMatch(galleryCss, /grid-template-columns\s*:/);
  assert.doesNotMatch(galleryCss, /column-count\s*:/);
  assert.doesNotMatch(galleryCss, /grid-auto-rows\s*:/);
  assert.doesNotMatch(galleryCss, /grid-row-end\s*:/);
  assert.doesNotMatch(galleryCss, /gallery-row-span/);
  assert.match(galleryCss, /column-gap:\s*var\(--gallery-gap\)/);
  assert.match(galleryCss, /row-gap:\s*var\(--gallery-gap\)/);
});

test("Gallery lightbox reads the one public wall instead of retired layer panels", () => {
  assert.doesNotMatch(lightboxSource, /data-gallery-layer-panel/);
  assert.match(lightboxSource, /root\.querySelectorAll<HTMLElement>\("\[data-gallery-card\]"\)/);
});

test("Gallery build plugin owns the renderer instead of leaving the physical input untouched", () => {
  assert.match(pluginSource, /renderGalleryPage/);
  assert.match(pluginSource, /page\.renderer === "gallery"/);
});
