import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { renderJesteiInterfaceCases } from "../src/components/page-sections/interface-cases.js";
import { renderMusicShoots } from "../src/components/page-sections/music-shoots.js";

const countMatches = (source, pattern) => source.match(pattern)?.length ?? 0;

test("index.html keeps lightweight mount points for extracted sections", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /id="jestei-interface-cases"/);
  assert.match(html, /id="music-shoots"/);
  assert.doesNotMatch(html, /class="music-shoots__state"/);
});

test("music shoots renderer outputs button-driven sliders without radio inputs", () => {
  const html = renderMusicShoots();

  assert.equal(countMatches(html, /class="music-shoots__project"/g), 4);
  assert.equal(countMatches(html, /class="music-shoots__nav-button"/g), 28);
  assert.equal(countMatches(html, /data-slider/g), 4);
  assert.match(html, /--active-index: 0/);
  assert.doesNotMatch(html, /music-shoots__state/);
  assert.doesNotMatch(html, /<label\b/);
});

test("interface cases renderer outputs modularized case markup", () => {
  const html = renderJesteiInterfaceCases();

  assert.equal(countMatches(html, /class="interface-cases__case"/g), 6);
  assert.equal(countMatches(html, /class="interface-cases__copy"/g), 6);
  assert.equal(countMatches(html, /class="interface-cases__media"/g), 6);
  assert.match(html, /interface-cases__desktop|interface-cases__phone|interface-cases__palette/);
});

test("main entry mounts modular sections before reveal hooks", async () => {
  const mainSource = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const interfaceMountIndex = mainSource.indexOf("mountJesteiInterfaceCases();");
  const musicMountIndex = mainSource.indexOf("mountMusicShoots();");
  const revealIndex = mainSource.indexOf("initGsapRevealHooks();");

  assert.ok(interfaceMountIndex >= 0);
  assert.ok(musicMountIndex >= 0);
  assert.ok(revealIndex > musicMountIndex);
  assert.ok(revealIndex > interfaceMountIndex);
});
