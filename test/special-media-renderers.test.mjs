import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { renderMediaFigure } from "../src/templates/media-figure.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";
import { jesteiBrandSystemGroup } from "../src/data/content/jestei-pool.ts";
import { sensetiqueStudioJustifiedGallery } from "../src/data/content/sensetique.ts";

const sliderModuleUrl = new URL("../src/templates/media-slider.ts", import.meta.url);
const galleryModuleUrl = new URL("../src/templates/justified-gallery.ts", import.meta.url);

test("media figure can preserve compound authored surfaces", () => {
  const overlay = renderMediaFigure({
    entryId: "jestei-02-source-02-16x10-use-01",
    captionView: "summary",
    className: "brand-system__item",
    mediaClassName: "fit-contain",
    surfaceClassName: "brand-system__surface",
    captionClassName: "brand-system__caption",
    captionFields: ["index", "title"],
    surfaceOverlay: {
      className: "brand-system__hover-copy",
      text: "Authored overlay copy",
    },
  });

  assert.match(overlay, /class="media__caption brand-system__caption"/);
  assert.match(overlay, /class="brand-system__hover-copy" data-lightbox-caption-copy>\s*Authored overlay copy\s*<\/p>/);
  assert.doesNotMatch(overlay, /media__text/);

  const pair = renderMediaFigure({
    entryId: "obladaet-04-source-01-4x5-use-02",
    captionView: "overlay",
    surfaceLayout: "pair",
    surfaceEntries: [
      { entryId: "obladaet-04-source-01-4x5-use-02", loading: "lazy" },
      { entryId: "obladaet-04-source-02-4x5-use-02", loading: "lazy" },
    ],
  });

  assert.match(pair, /class="media__surface" data-layout="pair"/);
  assert.equal((pair.match(/<img/g) ?? []).length, 2);
  assert.doesNotMatch(pair, /--media-ratio:/);

  const ratio = renderMediaFigure({
    entryId: "styx-01-source-04-9x16-use-01",
    captionView: "overlay",
    surface: { ratio: "4 / 5", fit: "cover", position: "50% 65%" },
    video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "metadata" },
  });

  assert.match(ratio, /--media-ratio: 4 \/ 5/);
  assert.match(ratio, /--media-fit: cover/);
  assert.match(ratio, /--media-position: 50% 65%/);
});

test("media slider renderer exists and preserves slide captions", async () => {
  assert.equal(existsSync(sliderModuleUrl), true, "media-slider.ts must exist");

  const { renderMediaSlider } = await import(sliderModuleUrl);
  const html = renderMediaSlider({
    captionView: "summary",
    slides: [
      { entryId: "styx-06-source-01-1920x913-use-01", captionView: "summary", loading: "lazy" },
      { entryId: "styx-06-source-02-1920x917-use-01", captionView: "summary", loading: "lazy" },
    ],
  });

  assert.match(html, /class="media slider"/);
  assert.equal((html.match(/data-slide=""/g) ?? []).length, 2);
  assert.equal((html.match(/data-slide-caption=""/g) ?? []).length, 2);
  assert.match(html, /Лицевая сторона печатного подарочного сертификата бренда/);
  assert.match(html, /Оборотная сторона печатного подарочного сертификата бренда/);
  assert.match(html, /01 \/ 02/);
  assert.match(html, /height="913" width="1920"/);

  const withoutDimensions = renderMediaSlider({
    captionView: "full",
    mediaDimensions: false,
    slides: [
      { entryId: "sensetique-11-source-69-320x213-use-03", captionView: "lightbox-only", loading: "lazy" },
    ],
  });
  assert.doesNotMatch(withoutDimensions, /(?:width|height)="[0-9]+"/);
});

test("justified gallery renderer exists and keeps authored row kinds", async () => {
  assert.equal(existsSync(galleryModuleUrl), true, "justified-gallery.ts must exist");

  const { renderJustifiedGallery } = await import(galleryModuleUrl);
  const html = renderJustifiedGallery({
    captionView: "overlay",
    rows: [
      {
        kind: "landscape",
        items: [{ entryId: "sensetique-01-source-06-3x2-use-01", loading: "lazy" }],
      },
      {
        kind: "portrait",
        items: [{ entryId: "sensetique-04-source-05-3x4-use-01", loading: "lazy" }],
      },
    ],
  });

  assert.match(html, /class="justified-gallery"/);
  assert.match(html, /data-row-kind="landscape"/);
  assert.match(html, /data-row-kind="portrait"/);
  assert.equal((html.match(/data-caption-view="overlay"/g) ?? []).length, 2);

  const productionHtml = renderJustifiedGallery(sensetiqueStudioJustifiedGallery);
  assert.match(productionHtml, /--media-ratio: 3 \/ 2/);
  assert.match(productionHtml, /--media-ratio: 2 \/ 3/);
  assert.doesNotMatch(productionHtml, /(?:width|height)="[0-9]+"/);
});

test("brand-system can opt out of automatic surface-ratio derivation", () => {
  const html = renderMediaGroup(jesteiBrandSystemGroup);
  assert.doesNotMatch(html, /--media-ratio:/);
});

test("standalone legacy media can omit intrinsic element dimensions without changing surface ratio", () => {
  const html = renderMediaFigure(
    {
      entryId: "sensetique-09-source-56-16x9-use-02",
      captionView: "summary",
      surface: { ratio: "16 / 9" },
      video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "metadata", mimeType: "video/mp4" },
    },
    { mediaDimensions: false },
  );

  assert.match(html, /--media-ratio: 16 \/ 9/);
  assert.doesNotMatch(html, /(?:width|height)="[0-9]+"/);
});
