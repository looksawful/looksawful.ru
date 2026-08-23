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
    /data-lightbox-caption-copy[^>]*>Мы сохранили узнаваемый шильд Jestei Pool/,
  );
  assert.match(
    interfaceGroup,
    /data-lightbox-caption-copy[^>]*>Мы начали группировать плейлисты/,
  );
});

test("lightbox navigation is project-scoped and gesture handling belongs to the media area", async () => {
  const lightbox = await read("src/components/media-lightbox.ts");

  assert.match(lightbox, /closest\("\.project"\)/);
  assert.doesNotMatch(lightbox, /\.media-group, \.project__section, \.project/);
  assert.match(lightbox, /data-lightbox-caption-copy/);
  assert.match(lightbox, /gestureArea\?\.addEventListener\("pointerdown"/);
  assert.match(lightbox, /dialog\.addEventListener\("close"/);
  assert.match(lightbox, /target === layout/);
  assert.match(lightbox, /\[data-slide\]\[data-active\] img, \[data-slide\]\[data-active\] video/);
  assert.doesNotMatch(lightbox, /source\.classList\.contains\("mockup__viewport"\)/);
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

  assert.match(smoke, /await verifyLightbox\(page, label\)/);
  assert.doesNotMatch(smoke, /viewport\.width\s*>=\s*768[^\n]*verifyLightbox/);
});
