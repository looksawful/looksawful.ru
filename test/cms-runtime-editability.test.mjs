import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pluginUrl = new URL("../src/site/build/site-pages-plugin.ts", import.meta.url);
const smokeCvUrl = new URL("../tools/smoke-cv.mjs", import.meta.url);
const pagesWorkflowUrl = new URL("../.github/workflows/pages.yml", import.meta.url);
const workflowUrls = [
  new URL("../.github/workflows/verify-pr.yml", import.meta.url),
  new URL("../.github/workflows/verify-dev.yml", import.meta.url),
  pagesWorkflowUrl,
];

test("CV dev rendering applies structured CMS content after canonical SitePage resolution", async () => {
  const plugin = await readFile(pluginUrl, "utf8");

  assert.match(plugin, /const page = getPageByPath\(pagePath\)/);
  assert.match(plugin, /page\.renderer === ["']cv["'][\s\S]*renderCvDevHtml/);
  assert.match(plugin, /renderCvDevHtml|transformCvContent/);
  assert.doesNotMatch(plugin, /pagePath === ["']\/cv\/["']/);
});

test("CV browser smoke derives editable profile and visibility expectations from structured content", async () => {
  const smoke = await readFile(smokeCvUrl, "utf8");

  assert.match(smoke, /cvContent/);
  assert.match(smoke, /cvContent\.profile\.name/);
  assert.match(smoke, /experience[\s\S]*visible/);
  assert.doesNotMatch(smoke, /hiddenCards\s*>\s*0/);
});

test("production deployment verifies stable CV structure rather than editable literal copy", async () => {
  const workflow = await readFile(pagesWorkflowUrl, "utf8");

  assert.doesNotMatch(workflow, /ИВАН КРУШИНСКИЙ/);
  assert.match(workflow, /grep -Fq '<main class="resume">'/);
});

test("generated-media cache stores only derivative binaries while tracked metadata stays repository-owned", async () => {
  for (const workflowUrl of workflowUrls) {
    const workflow = await readFile(workflowUrl, "utf8");
    const label = workflowUrl.pathname.split("/").at(-1);
    const cache = workflow.match(/\n      - name: Restore generated media\b[\s\S]*?(?=\n      - name: )/)?.[0] ?? "";
    const sync = workflow.match(/\n      - name: Sync generated media\b[\s\S]*?(?=\n      - name: )/)?.[0] ?? "";

    assert.match(cache, /public\/media\/generated\/responsive\b/, `${label} must cache responsive derivatives`);
    assert.match(cache, /public\/media\/generated\/video\b/, `${label} must cache video derivatives`);
    assert.doesNotMatch(cache, /responsive-manifest\.json|video-inventory\.json|responsive-generated\.ts/, `${label} must not cache tracked metadata`);
    assert.match(sync, /npm run media:sync/, `${label} must validate cache contents against current repository metadata`);
    assert.match(sync, /if:.*media-scope\.outputs\.needs_sync/);
    assert.match(workflow, /node tools\/ci\/media-scope\.mjs/);

  }
});
