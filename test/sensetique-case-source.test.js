import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const CASE_DIR = join(ROOT, "src/components/sensetique-case");
const HTML_PATH = join(CASE_DIR, "sensetique-case.html");
const CSS_PATH = join(CASE_DIR, "sensetique-case.css");
const JS_PATH = join(CASE_DIR, "sensetique-case.js");
const MAIN_PATH = join(ROOT, "src/main.js");
const PACKAGE_PATH = join(ROOT, "package.json");

function read(path) {
  return readFileSync(path, "utf8");
}

test("Sensetique production component is present and prepared before accordion content", () => {
  assert.equal(existsSync(HTML_PATH), true, "sensetique-case.html must exist");
  assert.equal(existsSync(CSS_PATH), true, "sensetique-case.css must exist");
  assert.equal(existsSync(JS_PATH), true, "sensetique-case.js must exist");

  const main = read(MAIN_PATH);
  assert.match(main, /prepareSensetiqueCase/);
  assert.match(main, /createSensetiqueCase/);
  assert.match(main, /sensetique-case\.css/);

  const prepareIndex = main.indexOf("prepareSensetiqueCase(document)");
  const contentIndex = main.indexOf("applyAccordionContent(document)");
  assert.ok(prepareIndex >= 0 && contentIndex >= 0 && prepareIndex < contentIndex);
});

test("Sensetique scene keeps the approved theme and becomes the third accordion scene", () => {
  const html = read(HTML_PATH);
  const js = read(JS_PATH);

  assert.match(html, /class="[^"]*cv-item--sensetique[^"]*"/);
  assert.match(html, /data-cv-theme="item-04"/);
  assert.match(js, /findSceneByProject\(root, "Styx Jewels"\)/);
  assert.match(js, /styx\.after\(replacement\)/);
});

test("Olovo transparent trio stays and the white-background catalogue is absent from markup", () => {
  const html = read(HTML_PATH);

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
  const html = read(HTML_PATH);
  const css = read(CSS_PATH);

  assert.doesNotMatch(html, /data-temp-media-group/);
  assert.doesNotMatch(css, /data-temp-media-group/);
  assert.doesNotMatch(css, /ГРУППА/);
  assert.doesNotMatch(css, /attr\(data-sensetique-group\)/);
});

test("Sensetique videos use one viewport-aware autoplay lifecycle", () => {
  const html = read(HTML_PATH);
  const js = read(JS_PATH);
  const autoplayMarkers = html.match(/data-sensetique-autoplay/g) ?? [];

  assert.equal(autoplayMarkers.length, 3);
  assert.doesNotMatch(html, /<video[^>]*\sautoplay(?:="")?/);
  assert.match(js, /function createViewportVideoPlayback/);
  assert.match(js, /new IntersectionObserver/);
  assert.match(js, /video\.play\(\)/);
  assert.match(js, /video\.pause\(\)/);
  assert.match(js, /accordionRuntime\?\.subscribeScene/);
});

test("PageFlip stays an explicit project dependency", () => {
  const pkg = JSON.parse(read(PACKAGE_PATH));
  assert.equal(pkg.dependencies?.["page-flip"], "2.0.7");
});
