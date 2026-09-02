import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { jesteiBrandSystemGroup, jesteiInterfaceGroup } from "../src/data/content/jestei-pool.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("caption architecture has one authored data-caption-view contract and no legacy interaction bridge", async () => {
  const [index, main, interactive, components, captions] = await Promise.all([
    read("index.html"),
    read("src/main.js"),
    read("src/interactive.js"),
    read("src/styles/components.css"),
    read("src/styles/captions.css"),
  ]);

  assert.doesNotMatch(index, /data-caption-rest=/);
  assert.doesNotMatch(index, /data-caption="/);
  assert.doesNotMatch(index, /<figure\b[^>]*\btabindex="0"/);

  assert.doesNotMatch(main, /media-caption\.js/);
  assert.doesNotMatch(interactive, /initMediaCaptionInteractions|data-caption-open|data-caption-rest|data-caption="overlay"/);
  assert.doesNotMatch(components, /data-caption-open|data-caption-rest|data-caption="overlay"/);
  assert.doesNotMatch(captions, /data-caption-rest|data-caption="overlay"/);
});

test("custom surface copy remains authored once and is explicitly available to the lightbox", () => {
  const brand = renderMediaGroup(jesteiBrandSystemGroup);
  const interfaceGroup = renderMediaGroup(jesteiInterfaceGroup);

  assert.equal((brand.match(/data-lightbox-caption-copy/g) ?? []).length, 6);
  assert.equal((interfaceGroup.match(/data-lightbox-caption-copy/g) ?? []).length, 3);

  assert.match(
    brand,
    /data-lightbox-caption-copy[^>]*>Переработали логотип Jestei Pool/,
  );
  assert.match(
    interfaceGroup,
    /data-lightbox-caption-copy[^>]*>Сгруппировали плейлисты, добавили заголовки и описания/,
  );
});

test("lightbox navigation is project-scoped and media shell belongs to the PhotoSwipe adapter", async () => {
  const [facade, adapter] = await Promise.all([
    read("src/components/media-lightbox.ts"),
    read("src/components/photoswipe-lightbox.ts"),
  ]);

  assert.match(facade, /closest\("\.project"\)/);
  assert.doesNotMatch(facade, /\.media-group, \.project__section, \.project/);
  assert.match(facade, /data-lightbox-caption-copy/);
  assert.match(facade, /createPhotoSwipeLightbox/);
  assert.match(facade, /\[data-slide\]\[data-active\] img, \[data-slide\]\[data-active\] video/);
  assert.doesNotMatch(facade, /source\.classList\.contains\("mockup__viewport"\)/);
  assert.doesNotMatch(facade, /showModal\(|HTMLDialogElement|data-lightbox-image|data-lightbox-video/);

  assert.match(adapter, /photoswipe\/lightbox/);
  assert.match(adapter, /contentLoad/);
  assert.match(adapter, /contentActivate/);
  assert.match(adapter, /contentDeactivate/);
  assert.match(adapter, /contentDestroy/);
});

test("persistent rails and standalone sliders keep captions out of page geometry but available to lightbox", async () => {
  const [styles, facade] = await Promise.all([
    read("src/styles/index.css"),
    read("src/components/media-lightbox.ts"),
  ]);

  assert.match(styles, /\.media-group\[data-layout="strip"\]/);
  assert.match(styles, /\.media-group\[data-layout="grid"\]\[data-overflow="reel"\]/);
  assert.match(styles, /\.justified-gallery__row/);
  assert.match(
    styles,
    /\.slider\[data-media-deck\] \[data-slide-caption\]:not\(\[data-caption-view="full"\]\)/,
  );
  assert.match(styles, /figure\.media\[data-caption-view="overlay"\]::after[\s\S]*?content:\s*none/);

  assert.match(facade, /MARKABLE_SOURCE_SELECTOR/);
  assert.match(facade, /\.slider\[data-media-deck\] > \.slider__viewport/);
  assert.match(facade, /data-slide-caption\]\[data-active\]/);
});

test("lightbox CSS has bounded media and explicit touch portrait/landscape layouts", async () => {
  const [components, captions] = await Promise.all([
    read("src/styles/components.css"),
    read("src/styles/captions.css"),
  ]);

  assert.match(components, /\.media-lightbox__figure[\s\S]*?block-size:\s*100%/);
  assert.match(components, /touch-action:\s*pan-y/);
  assert.match(components, /orientation:\s*portrait/);
  assert.match(components, /orientation:\s*landscape/);
  assert.match(captions, /orientation:\s*landscape[\s\S]*?max-block-size:\s*100%/);
});

test("content facade re-exports the single media presentation contract instead of redefining caption types", async () => {
  const content = await read("src/types/content.ts");

  assert.match(content, /from "\.\/media-presentation\.ts"/);
  assert.doesNotMatch(content, /export type MediaCaptionView\s*=/);
  assert.doesNotMatch(content, /export interface MediaFigureData/);
  assert.doesNotMatch(content, /export interface MockupData/);
});

test("custom Jestei hover copy is a fine-pointer enhancement, while touch goes straight to lightbox", async () => {
  const components = await read("src/styles/components.css");

  assert.match(
    components,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.brand-system__item:is\(:hover, :focus-visible, :focus-within\)[\s\S]*?\.brand-system__hover-copy/,
  );
  assert.match(
    components,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.jestei-captioned-media:is\(:hover, :focus-visible, :focus-within\)[\s\S]*?\.jestei-media__hover-copy/,
  );
});

test("browser smoke exercises first-tap lightbox behavior on touch viewports too", async () => {
  const smoke = await read("tools/smoke-site.mjs");

  assert.match(smoke, /await verifyLightbox\(page, label/);
  assert.doesNotMatch(smoke, /viewport\.width\s*>=\s*768[^\n]*verifyLightbox/);
});