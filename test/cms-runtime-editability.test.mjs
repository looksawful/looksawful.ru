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

test("CV dev rendering applies structured CMS content instead of only rewriting the URL", async () => {
  const plugin = await readFile(pluginUrl, "utf8");

  assert.match(plugin, /renderCvDevHtml|transformCvContent/);
  assert.match(plugin, /pagePath === ["']\/cv\/["']/);
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

test("generated-media cache restores metadata together with derivative binaries", async () => {
  for (const workflowUrl of workflowUrls) {
    const workflow = await readFile(workflowUrl, "utf8");
    const label = workflowUrl.pathname.split("/").at(-1);

    assert.match(workflow, /public\/media\/generated\/responsive-manifest\.json/, `${label} must cache responsive manifest`);
    assert.match(workflow, /public\/media\/generated\/video-inventory\.json/, `${label} must cache video inventory`);
    assert.match(workflow, /src\/data\/media\/responsive-generated\.ts/, `${label} must cache generated responsive catalog`);
  }
});
