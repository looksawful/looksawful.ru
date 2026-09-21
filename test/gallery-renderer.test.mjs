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
const modelViewerSource = await readFile(
  new URL("../src/components/model-viewer.ts", import.meta.url),
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

test("Gallery renders exactly five approved Jestei symbols as interactive model cards", () => {
  const modelCards = [...html.matchAll(/<figure class="gallery-card gallery-card--model"[\s\S]*?<\/figure>/g)]
    .map((match) => match[0]);

  assert.equal(modelCards.length, 5);
  assert.deepEqual(
    modelCards.map((card) => card.match(/data-model-src="([^"]+)"/)?.[1]),
    [
      "/media/logo-3d/jestei/jestei-symbol-metal.glb",
      "/media/logo-3d/jestei/jestei-symbol-pear.glb",
      "/media/logo-3d/jestei/jestei-symbol-orange.glb",
      "/media/logo-3d/jestei/jestei-symbol-blue.glb",
      "/media/logo-3d/jestei/jestei-symbol-biloba.glb",
    ],
  );

  for (const card of modelCards) {
    assert.match(card, /data-model-autorotate="false"/);
    assert.match(card, /data-model-viewer-runtime/);
    assert.match(card, /data-model-viewer-runtime[^>]*tabindex="0"/);
    assert.match(card, /data-model-viewer-runtime[^>]*role="group"/);
    assert.match(card, /data-model-viewer-canvas/);
    assert.doesNotMatch(card, /\bdata-gallery-card\b/, "3D models must not enter the PhotoSwipe stream");
  }
});

test("Gallery photo controls expose item-specific accessible names", () => {
  const cards = [...html.matchAll(/<figure class="gallery-card"[\s\S]*?<\/figure>/g)].map((match) => match[0]);
  assert.ok(cards.length > 0, "Gallery must render photo controls");

  for (const card of cards) {
    const title = card.match(/data-gallery-title="([^"]*)"/)?.[1] ?? "";
    const alt = card.match(/data-gallery-alt="([^"]*)"/)?.[1] ?? "";
    const label = card.match(/aria-label="([^"]*)"/)?.[1] ?? "";
    const identity = title.trim() || alt.trim();

    assert.ok(identity, "Gallery photo control must have canonical title or alt identity");
    assert.equal(label, `Открыть изображение: ${identity}`);
  }
});

test("Production model viewer exposes a keyboard rotate, zoom and reset path with cleanup", () => {
  assert.match(modelViewerSource, /addEventListener\("keydown"/);
  assert.match(modelViewerSource, /"ArrowLeft"/);
  assert.match(modelViewerSource, /"ArrowRight"/);
  assert.match(modelViewerSource, /"ArrowUp"/);
  assert.match(modelViewerSource, /"ArrowDown"/);
  assert.match(modelViewerSource, /"Home"/);
  assert.match(modelViewerSource, /data-model-viewer-action/);
  assert.match(modelViewerSource, /removeEventListener\("keydown"/);
});

test("Gallery cards never expose an empty accessible image label when canonical title exists", () => {
  const cards = [...html.matchAll(/<figure class="gallery-card"[\s\S]*?<\/figure>/g)].map((match) => match[0]);
  assert.ok(cards.length > 0, "Gallery must render cards");

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

test("Gallery PhotoSwipe credits inherit a high-contrast lightbox surface", () => {
  const lightboxRule = mediaLightboxCss.match(
    /\.media-lightbox\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";
  const photoswipeBackgroundRule = mediaLightboxCss.match(
    /\.media-lightbox--photoswipe \.pswp__bg\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";
  const captionRule = mediaLightboxCss.match(
    /\.media-lightbox--photoswipe \.media-lightbox__caption\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(lightboxRule, /color:\s*#fff\b/);
  assert.match(lightboxRule, /background:/);
  assert.match(photoswipeBackgroundRule, /background:\s*rgb\(0 0 0 \/ 1\)/);
  assert.match(captionRule, /position:\s*absolute/);
});

test("Gallery CSS has no retired heading styles and explicitly avoids masonry mechanics", () => {
  assert.doesNotMatch(galleryCss, /\.gallery__header\b/);
  assert.doesNotMatch(galleryCss, /\.gallery__title\b/);
  assert.doesNotMatch(galleryCss, /column-count\s*:/);
  assert.doesNotMatch(galleryCss, /grid-auto-rows\s*:/);
  assert.doesNotMatch(galleryCss, /grid-row-end\s*:/);
  assert.doesNotMatch(galleryCss, /gallery-row-span/);
  assert.doesNotMatch(galleryCss, /data-gallery-layout-ready/);
  assert.match(galleryCss, /\.gallery-card--model\s*\{/);
  assert.match(galleryCss, /\.gallery-model\[data-model-state="ready"\]/);
  assert.match(galleryCss, /touch-action:\s*none/);
});

test("Gallery lightbox reads the one public photo stream instead of retired layer panels", () => {
  assert.doesNotMatch(lightboxSource, /data-gallery-layer-panel/);
  assert.match(lightboxSource, /root\.querySelectorAll<HTMLElement>\("\[data-gallery-card\]"\)/);
});

test("Gallery build plugin owns the renderer instead of leaving the physical input untouched", () => {
  assert.match(pluginSource, /renderGalleryPage/);
  assert.match(pluginSource, /page\.renderer === "gallery"/);
});
