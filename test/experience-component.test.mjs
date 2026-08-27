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

test("experience typography keeps the approved compact fluid composition", async () => {
  assert.equal(existsSync(stylesUrl), true, "experience.css should exist");
  const styles = await readFile(stylesUrl, "utf8");

  assert.match(styles, /font-size:\s*clamp\(1rem,\s*0\.72rem \+ 1\.35cqi,\s*2\.25rem\)/);
  assert.match(styles, /font-weight:\s*440/);
  assert.match(styles, /line-height:\s*0\.97/);
  assert.match(styles, /letter-spacing:\s*-0\.035em/);
  assert.match(styles, /font-variant-numeric:\s*tabular-nums/);
});
