import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CV dev rendering uses canonical SitePage and composed CV content", async () => {
  const plugin = await read("src/site/build/site-pages-plugin.ts");
  const cv = await read("src/data/cv.ts");
  const source = await read("src/data/cv-source.ts");

  assert.match(plugin, /const page = getPageByPath\(pagePath\)/);
  assert.match(plugin, /page\.renderer === ["']cv["'][\s\S]*renderCvDevHtml/);
  assert.match(plugin, /renderCvDevHtml|transformCvContent/);
  assert.doesNotMatch(plugin, /pagePath === ["']\/cv\/["']/);
  assert.match(cv, /cvSourceJson/);
  assert.match(cv, /export const cvContent = parseCvContent/);
  assert.match(source, /src\/content|\.\.\/content\/cv\.json/);
  assert.match(source, /\.\.\/content\/editorial\/cv\.json/);
  assert.doesNotMatch(source, /deepMerge|Object\.assign/);
});

test("CV browser smoke derives editable copy and structural visibility from composed content", async () => {
  const smoke = await read("tools/smoke-cv.mjs");
  assert.match(smoke, /cvContent/);
  assert.match(smoke, /cvContent\.profile\.name/);
  assert.match(smoke, /experience[\s\S]*visible/);
  assert.doesNotMatch(smoke, /hiddenCards\s*>\s*0/);
});

test("production deployment verifies stable CV output without pinning editable literal copy", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  assert.doesNotMatch(workflow, /ИВАН КРУШИНСКИЙ/);
  assert.match(workflow, /npm run cv:prod:prepare/);
  assert.match(workflow, /npm run cv:prod:verify/);
  assert.match(workflow, /https:\/\/www\.looksawful\.ru\/cv\//);
});

test("generated-media cache stores derivative binaries and canonical marker, not tracked metadata", async () => {
  for (const name of ["ci-fast.yml", "pages.yml", "cms-media.yml"]) {
    const workflow = await read(`.github/workflows/${name}`);
    assert.match(workflow, /public\/media\/generated\/responsive\b/, `${name}: responsive derivatives`);
    assert.match(workflow, /public\/media\/generated\/video\/\*\.web/, `${name}: video derivatives`);
    assert.match(workflow, /\.cache\/media\/generated-cache\.json/, `${name}: canonical marker`);
    assert.doesNotMatch(
      workflow.match(/uses: actions\/cache\/(?:restore|save)@v4[\s\S]*?(?=\n      - name: |$)/)?.[0] ?? "",
      /responsive-manifest\.json|video-inventory\.json|responsive-generated\.ts/,
      `${name}: tracked metadata must stay repository-owned`,
    );
    assert.match(workflow, /media-dev-state\.mjs --cache-verify/);
  }
});
