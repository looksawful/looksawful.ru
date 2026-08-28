import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../src/components/experience.ts", import.meta.url);
const stylesUrl = new URL("../src/styles/experience.css", import.meta.url);
const mainUrl = new URL("../src/main.js", import.meta.url);
const indexStylesUrl = new URL("../src/styles/index.css", import.meta.url);

test("experience component is mounted and styled as an isolated component", async () => {
  const main = await readFile(mainUrl, "utf8");
  const indexStyles = await readFile(indexStylesUrl, "utf8");

  assert.match(main, /import \{ mountExperience \} from "\.\/components\/experience\.ts";/);
  assert.match(main, /mountExperience\(document\);/);
  assert.match(indexStyles, /@import "\.\/experience\.css" layer\(components\);/);

  assert.equal(existsSync(componentUrl), true, "experience.ts should exist");
  assert.equal(existsSync(stylesUrl), true, "experience.css should exist");
});

test("experience visibility is controlled by a data attribute and defaults to hidden", async () => {
  const [source, styles] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(source, /section\.dataset\.experienceVisibility \?\? "hidden"/);
  assert.match(source, /section\.dataset\.experienceVisibility = visibility/);
  assert.match(source, /if \(visibility === "hidden"\) \{[\s\S]*section\.hidden = true;[\s\S]*return;/);
  assert.match(styles, /\.experience\[data-experience-visibility="hidden"\]\s*\{[\s\S]*display:\s*none\s*!important/);
});

test("experience renders only the approved seven engagements", async () => {
  assert.equal(existsSync(componentUrl), true, "experience.ts should exist");
  const source = await readFile(componentUrl, "utf8");

  const approvedIds = [
    "jestei-pool-2024-2026",
    "styx-jewel-2021-2025",
    "sensetique-2016-2018",
    "mad-cow-films-2019",
    "li-ne-agency-2017",
    "progress-tradition-2013-2015",
    "moskovskie-novosti-2012",
  ];

  for (const id of approvedIds) assert.match(source, new RegExp(`"${id}"`));
  assert.doesNotMatch(source, /lyve-moscow-2025|berry-agency-2020|s-and-s-2018-2019/);
  assert.match(source, /experience__period/);
  assert.match(source, /experience__arrow/);
  assert.match(source, /experience__place/);
});

test("experience renders the workplaces heading and labels the section from it", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /<h2 id="experience-title">Места работы<\/h2>/);
  assert.match(source, /section\.setAttribute\("aria-labelledby",\s*"experience-title"\)/);
  assert.doesNotMatch(source, /section\.setAttribute\("aria-label",\s*"Опыт работы"\)/);
});

test("experience typography stays compact and shifts left only on wide layouts", async () => {
  assert.equal(existsSync(stylesUrl), true, "experience.css should exist");
  const styles = await readFile(stylesUrl, "utf8");

  assert.match(styles, /font-size:\s*clamp\(0\.9375rem,\s*0\.8rem \+ 0\.65cqi,\s*1\.625rem\)/);
  assert.match(styles, /font-weight:\s*440/);
  assert.match(styles, /line-height:\s*0\.97/);
  assert.match(styles, /letter-spacing:\s*-0\.035em/);
  assert.match(styles, /font-variant-numeric:\s*tabular-nums/);
  assert.match(styles, /margin-block-start:\s*0\.11em/);
  assert.match(styles, /@container page-section \(width > 64rem\)[\s\S]*translate:\s*clamp\(-3rem,\s*-2\.2cqi,\s*-1\.5rem\) 0/);
});