import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Sensetique is materialized in source light DOM directly after Styx", () => {
  const html = read("index.html");
  const projects = [...html.matchAll(/<span[^>]*class="[^"]*cv-item__project[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]
    .map(([, name]) => name.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
  const styx = projects.indexOf("Styx Jewels");
  const sensetique = projects.indexOf("Sensetique");
  assert.ok(styx >= 0);
  assert.equal(sensetique, styx + 1);
  assert.equal(projects.filter((name) => name === "Sensetique").length, 1);
  assert.equal(existsSync("src/components/sensetique-case/sensetique-case.css"), true);
  assert.equal(existsSync("tools/sensetique-index-plugin.mjs"), false);
  assert.equal(existsSync("src/components/sensetique-case/data"), false);
});

test("Sensetique media remains source HTML and temporary group labels stay absent", () => {
  const html = read("index.html");
  const css = read("src/components/sensetique-case/sensetique-case.css");
  for (const id of ["sensetique-11-98", "sensetique-11-99", "sensetique-11-100"]) {
    assert.equal(html.split('data-media-id="' + id + '"').length - 1, 1);
  }
  assert.doesNotMatch(html, /sensetique-olovo-catalog-tiles/);
  assert.doesNotMatch(html, /data-temp-media-group/);
  assert.doesNotMatch(css, /data-temp-media-group|ГРУППА|attr\(data-sensetique-group\)/);
});

test("CV source is a permanently expanded sheet stack", () => {
  const html = read("index.html");
  const css = read("src/components/cv-sheets/cv-sheets.css");
  const main = read("src/main.js");
  assert.match(html, /class="[^"]*cv-sheets-scene/);
  assert.match(html, /class="[^"]*cv-sheets__list/);
  assert.doesNotMatch(html, /data-mode="scroll"|data-reduced-mode=|data-cv-accordion/);
  assert.doesNotMatch(main, /createCvAccordion|applyAccordionContent|applyAccordionPresentation|prepareSensetiqueCase/);
  assert.doesNotMatch(css, /:nth-child\([^}]*cv-item/);
  assert.match(css, /data-cv-theme="item-04"/);
});
