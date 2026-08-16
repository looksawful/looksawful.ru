import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";

const ROOT = process.cwd();
const CASE_DIR = join(ROOT, "src/components/sensetique-case");
const HTML_PATH = join(CASE_DIR, "sensetique-case.html");
const JS_PATH = join(CASE_DIR, "sensetique-case.js");
const SCENE_PATH = join(CASE_DIR, "scene.js");
const VIDEO_PATH = join(CASE_DIR, "video-autoplay.js");
const FLIPBOOK_PATH = join(CASE_DIR, "flipbook.js");
const MAIN_PATH = join(ROOT, "src/main.js");
const PLUGIN_PATH = join(ROOT, "tools/sensetique-index-plugin.mjs");
const VITE_CONFIG_PATH = join(ROOT, "vite.config.js");
const CONTENT_GZIP_PATH = join(ROOT, "public/case-data/sensetique-content.html.gz");
const STYLE_GZIP_PATH = join(ROOT, "public/case-data/sensetique-style.css.gz");

function read(path) {
  return readFileSync(path, "utf8");
}

function gunzipText(path) {
  return gunzipSync(readFileSync(path)).toString("utf8");
}

test("Sensetique is injected before the shared accordion runtime is prepared", () => {
  for (const path of [
    HTML_PATH,
    JS_PATH,
    SCENE_PATH,
    VIDEO_PATH,
    FLIPBOOK_PATH,
    PLUGIN_PATH,
    VITE_CONFIG_PATH,
    CONTENT_GZIP_PATH,
    STYLE_GZIP_PATH,
  ]) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }

  const main = read(MAIN_PATH);
  assert.match(main, /prepareSensetiqueCase/);
  assert.match(main, /createSensetiqueCase/);

  const prepareIndex = main.indexOf("prepareSensetiqueCase(document)");
  const contentIndex = main.indexOf("applyAccordionContent(document)");
  assert.ok(prepareIndex >= 0 && contentIndex >= 0 && prepareIndex < contentIndex);
});

test("build integration replaces Sensetique and places it immediately after Styx", () => {
  const html = read(HTML_PATH);
  const scene = read(SCENE_PATH);
  const plugin = read(PLUGIN_PATH);
  const vite = read(VITE_CONFIG_PATH);

  assert.match(html, /class="[^"]*cv-item--sensetique[^"]*"/);
  assert.match(html, /data-cv-theme="item-04"/);
  assert.match(scene, /findSceneByProject\(root, "Styx Jewels"\)/);
  assert.match(scene, /styx\.after\(sensetique\)/);
  assert.match(plugin, /sensetique-content\.html\.gz/);
  assert.match(plugin, /sensetique-style\.css\.gz/);
  assert.match(plugin, /replaceSensetiqueScene/);
  assert.match(plugin, /findTopLevelProjectArticle\(withoutCurrent, "Styx Jewels"\)/);
  assert.match(plugin, /data-sensetique-case-styles/);
  assert.match(vite, /createSensetiqueIndexPlugin/);
});

test("Olovo transparent trio stays and the white-background catalogue is absent", () => {
  const html = gunzipText(CONTENT_GZIP_PATH);

  for (const id of ["sensetique-11-98", "sensetique-11-99", "sensetique-11-100"]) {
    assert.equal(html.split(`data-media-id="${id}"`).length - 1, 1, `${id} must stay once`);
  }

  assert.doesNotMatch(html, /sensetique-olovo-catalog-tiles/);
  assert.doesNotMatch(html, /data-olovo-arc-source/);
  for (let index = 15; index <= 26; index += 1) {
    assert.doesNotMatch(html, new RegExp(`data-media-id="sensetique-13-${index}"`));
  }
});

test("temporary group labels cannot render", () => {
  const html = gunzipText(CONTENT_GZIP_PATH);
  const css = gunzipText(STYLE_GZIP_PATH);

  assert.doesNotMatch(html, /data-temp-media-group/);
  assert.doesNotMatch(css, /data-temp-media-group/);
  assert.doesNotMatch(css, /ГРУППА/);
  assert.doesNotMatch(css, /attr\(data-sensetique-group\)/);
});

test("Sensetique videos use one viewport-aware autoplay lifecycle", () => {
  const html = gunzipText(CONTENT_GZIP_PATH);
  const video = read(VIDEO_PATH);
  const autoplayMarkers = html.match(/data-sensetique-autoplay/g) ?? [];

  assert.equal(autoplayMarkers.length, 3);
  assert.doesNotMatch(html, /<video[^>]*\sautoplay(?:="")?/);
  assert.match(video, /function createViewportVideoPlayback/);
  assert.match(video, /new IntersectionObserver/);
  assert.match(video, /video\.play\(\)/);
  assert.match(video, /video\.pause\(\)/);
  assert.match(video, /accordionRuntime\?\.subscribeScene/);
});

test("PageFlip is pinned and loaded only by the Sensetique flipbook runtime", () => {
  const flipbook = read(FLIPBOOK_PATH);
  assert.match(
    flipbook,
    /https:\/\/unpkg\.com\/page-flip@2\.0\.7\/dist\/js\/page-flip\.browser\.js/,
  );
  assert.match(flipbook, /data-sensetique-page-flip/);
});
