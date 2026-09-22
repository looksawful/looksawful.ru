import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderGalleryPage } from "../src/site/renderers/gallery-page.ts";
import { renderGalleryResolvedSeries } from "../src/components/gallery/gallery-markup.ts";

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
const sharedLightboxSource = await readFile(
  new URL("../src/components/photoswipe-lightbox.ts", import.meta.url),
  "utf8",
);
const videoPreviewSource = await readFile(
  new URL("../src/components/gallery/gallery-video-preview.ts", import.meta.url),
  "utf8",
).catch(() => "");

const galleryPage = sitePages.find((page) => page.id === "gallery");
assert.ok(galleryPage && galleryPage.type === "gallery");

const html = renderGalleryPage(galleryPage);

test("Gallery renderer emits semantic build-time content with a non-visual page heading", () => {
  assert.match(html, /<body[^>]*data-page-type="gallery"[^>]*>/);
  assert.match(html, /data-site-navigation/);
  assert.match(html, /<main\b/);
  assert.match(html, /<section[^>]*data-gallery/);
  assert.match(html, /<h1 class="visually-hidden">Галерея<\/h1>/);
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

test("Gallery production markup renders typed image, video, model and multi-slide placements", () => {
  const markup = renderGalleryResolvedSeries({
    id: "mixed-series",
    projectLabel: "Jestei Pool",
    placements: [
      {
        itemId: "image-a",
        seriesId: "mixed-series",
        seriesOrder: 0,
        itemOrder: 0,
        featured: true,
        media: [{
          assetId: "image-a",
          kind: "image",
          src: "/media/image-a.webp",
          posterSrc: "/media/image-a.webp",
          width: 1200,
          height: 800,
          title: "Image A",
          alt: "Image A alt",
          credits: [],
        }],
      },
      {
        itemId: "video-a",
        seriesId: "mixed-series",
        seriesOrder: 0,
        itemOrder: 1,
        featured: false,
        media: [{
          assetId: "video-a",
          kind: "video",
          src: "/media/video-a.mp4",
          posterSrc: "/media/video-a-poster.webp",
          width: 1280,
          height: 720,
          title: "Video A",
          alt: "Video A alt",
          credits: ["Ivan"],
        }],
      },
      {
        itemId: "document-a",
        seriesId: "mixed-series",
        seriesOrder: 0,
        itemOrder: 2,
        featured: false,
        media: [
          {
            assetId: "document-a",
            kind: "image",
            src: "/media/document-a.webp",
            posterSrc: "/media/document-a.webp",
            width: 1000,
            height: 1400,
            title: "Document A",
            alt: "Document A page 1",
            credits: [],
          },
          {
            assetId: "document-b",
            kind: "image",
            src: "/media/document-b.webp",
            posterSrc: "/media/document-b.webp",
            width: 1000,
            height: 1400,
            title: "Document A",
            alt: "Document A page 2",
            credits: [],
          },
        ],
      },
      {
        itemId: "model-a",
        seriesId: "mixed-series",
        seriesOrder: 0,
        itemOrder: 3,
        featured: false,
        media: [{
          assetId: "model-a",
          kind: "model",
          src: "/media/model-a.glb",
          posterSrc: "/media/model-a-poster.webp",
          title: "Model A",
          alt: "Model A alt",
          credits: [],
        }],
      },
    ],
  });

  assert.match(markup, /data-gallery-series="mixed-series"/);
  assert.match(markup, /class="gallery-series__marker">Jestei Pool<\/p>/);
  assert.equal((markup.match(/\bdata-gallery-card\b/g) ?? []).length, 4);
  assert.match(markup, /data-gallery-item-id="image-a"[^>]*data-gallery-featured/);
  assert.match(markup, /data-gallery-item-id="video-a"[^>]*data-gallery-kind="video"/);
  assert.match(markup, /data-gallery-item-id="video-a"[\s\S]*?src="\/media\/video-a-poster\.webp"/);
  assert.doesNotMatch(markup, /<video\b[^>]*autoplay/i);
  assert.equal((markup.match(/data-gallery-item-id="document-a"/g) ?? []).length, 1);
  assert.match(markup, /data-gallery-item-id="document-a"[\s\S]*?data-gallery-slide="1"[\s\S]*?data-gallery-slide="2"/);
  assert.match(markup, /data-gallery-item-id="model-a"[^>]*data-gallery-kind="model"/);
  assert.match(markup, /data-gallery-item-id="model-a"[\s\S]*?src="\/media\/model-a-poster\.webp"/);
});

test("Gallery production page uses typed placement markup for its canonical photo stream", () => {
  assert.match(html, /class="gallery-series__marker">[^<]+<\/p>/);
  assert.match(html, /\bdata-gallery-media\b/);
  assert.match(html, /data-gallery-slide="1"/);
  assert.match(html, /data-gallery-kind="image"/);
});

test("Gallery video cards are poster-first and preview only on deliberate hover or keyboard focus", () => {
  const markup = renderGalleryResolvedSeries({
    id: "video-preview",
    projectLabel: "Jestei Pool",
    placements: [{
      itemId: "video-a",
      seriesId: "video-preview",
      seriesOrder: 0,
      itemOrder: 0,
      projectId: "project-a",
      featured: false,
      media: [{
        assetId: "video-a",
        kind: "video",
        src: "/media/video-a.mp4",
        posterSrc: "/media/video-a-poster.webp",
        width: 1280,
        height: 720,
        title: "Video A",
        alt: "Video A alt",
        credits: [],
      }],
    }],
  });

  assert.match(markup, /<img[^>]+src="\/media\/video-a-poster\.webp"/);
  assert.match(markup, /<video[^>]+data-gallery-video-preview[^>]+muted[^>]+playsinline[^>]+preload="metadata"/i);
  assert.doesNotMatch(markup, /<video[^>]+autoplay/i);
  assert.match(markup, /gallery-card__play-indicator/);

  assert.match(videoPreviewSource, /currentTime\s*=\s*0/);
  assert.match(videoPreviewSource, /pointerover/);
  assert.match(videoPreviewSource, /focusin/);
  assert.match(videoPreviewSource, /pointerout/);
  assert.match(videoPreviewSource, /focusout/);
  assert.match(videoPreviewSource, /\.pause\(\)/);
  assert.match(videoPreviewSource, /\(hover:\s*hover\) and \(pointer:\s*fine\)/);
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
    assert.match(card, /data-model-viewer-canvas/);
    assert.doesNotMatch(card, /\bdata-gallery-card\b/, "3D models must not enter the PhotoSwipe stream");
  }
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

test("Gallery photo controls expose item-specific accessible names", () => {
  const cards = [...html.matchAll(/<figure class="gallery-card"[\s\S]*?<\/figure>/g)]
    .map((match) => match[0]);
  assert.ok(cards.length > 0, "Gallery must render photo controls");

  for (const card of cards) {
    const label = card.match(/\baria-label="([^"]*)"/)?.[1] ?? "";
    const title = card.match(/\bdata-gallery-title="([^"]*)"/)?.[1] ?? "";
    const alt = card.match(/\bdata-gallery-alt="([^"]*)"/)?.[1] ?? "";
    const identity = alt.trim() || title.trim();

    assert.ok(identity, "Gallery photo control must expose authored identity");
    assert.equal(label, `Открыть: ${identity}`);
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

test("Gallery viewer is series-bounded and delegates image/video rendering to the shared PhotoSwipe seam", () => {
  assert.match(lightboxSource, /createPhotoSwipeLightbox/);
  assert.doesNotMatch(lightboxSource, /new PhotoSwipeLightbox/);
  assert.match(lightboxSource, /closest<HTMLElement>\("\[data-gallery-series\]"\)/);
  assert.match(lightboxSource, /loop:\s*false/);
  assert.match(lightboxSource, /kind === "video"[\s\S]*?muted:\s*true/);
  assert.match(lightboxSource, /kind === "model"[\s\S]*?kind:\s*"image"/);
  assert.match(sharedLightboxSource, /onChange\?:/);
  assert.match(sharedLightboxSource, /onClose\?:/);
  assert.match(sharedLightboxSource, /loop\?:\s*boolean/);
});

test("Gallery lightbox reads the one public photo stream instead of retired layer panels", () => {
  assert.doesNotMatch(lightboxSource, /data-gallery-layer-panel/);
  assert.match(lightboxSource, /root\.querySelectorAll<HTMLElement>\("\[data-gallery-card\]"\)/);
});

test("Gallery build plugin owns the renderer instead of leaving the physical input untouched", () => {
  assert.match(pluginSource, /renderGalleryPage/);
  assert.match(pluginSource, /page\.renderer === "gallery"/);
});
