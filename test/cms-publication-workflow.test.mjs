import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function publicationAction(config) {
  const start = config.indexOf("  - name: prepare-publication\n");
  assert.notEqual(start, -1, "Pages CMS publication action must exist");
  const rest = config.slice(start);
  const next = rest.indexOf("\ncontent:\n");
  return next === -1 ? rest : rest.slice(0, next);
}

test("Pages CMS dispatches publication authorization from trusted prod", async () => {
  const cms = await read(".pages.yml");
  const action = publicationAction(cms);
  assert.match(action, /workflow: pages-cms-publish\.yml/);
  assert.match(action, /ref: prod\b/);
  assert.doesNotMatch(action, /ref: current\b/);
});

test("publication workflow validates temporary content source while executing trusted policy from prod", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /source_ref/);
  assert.match(workflow, /node tools\/cms-authoring-source\.mjs[\s\S]*--branch "?\$source_ref"?/);
  assert.match(workflow, /WORKFLOW_REF/);
  assert.match(workflow, /"\$WORKFLOW_REF" != "prod"|WORKFLOW_REF[^\n]*!= "prod"/);
  assert.doesNotMatch(workflow, /origin\/dev|refs\/heads\/dev|--head dev/);
});

test("publication fetches current prod and validated source into a fixed remote ref", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /refs\/heads\/prod:refs\/remotes\/origin\/prod/);
  assert.match(workflow, /refs\/heads\/\$\{source_ref\}:refs\/remotes\/origin\/cms-source|refs\/heads\/\$source_ref:refs\/remotes\/origin\/cms-source/);
  assert.match(workflow, /node tools\/cms-publication-topology\.mjs[\s\S]*--prod origin\/prod[\s\S]*--source origin\/cms-source/);

  const topology = workflow.indexOf("cms-publication-topology.mjs");
  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  assert.ok(topology !== -1, "content-aware topology guard must be invoked");
  assert.ok(topology < classifier, "topology must be authorized before path classification");
});

test("trusted classifier sees exact prod to source diff before PR operations", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /cms-publication-scope\.mjs/);
  assert.match(workflow, /origin\/prod\.\.origin\/cms-source/);
  assert.match(workflow, /git[\s\S]*diff[\s\S]*--name-only[\s\S]*--no-renames[\s\S]*-z[\s\S]*origin\/prod\.\.origin\/cms-source/);

  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  const list = workflow.indexOf("gh pr list");
  const create = workflow.indexOf("gh pr create");
  assert.ok(classifier !== -1, "publication classifier must be invoked");
  assert.ok(list !== -1 && classifier < list, "current diff must pass classifier before an existing PR is reused");
  assert.ok(create !== -1 && classifier < create, "current diff must pass classifier before PR creation");
});

test("publication prepares source to prod PR and stops without merge, deploy or prod mutation", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: write/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.match(workflow, /gh pr list[\s\S]*--base prod[\s\S]*--head "?\$source_ref"?/);
  assert.match(workflow, /gh pr create[\s\S]*--base prod[\s\S]*--head "?\$source_ref"?/);
  assert.match(workflow, /Publication PR prepared/);
  assert.doesNotMatch(workflow, /gh pr checks|actions\/deploy-pages|git push[^\n]*prod/);
  assert.doesNotMatch(workflow, /\/pulls\/\$\{PR_NUMBER\}\/merge/);
});

test("Fast CI PR verification targets prod and does not treat dev as an active integration branch", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");
  const prBlock = workflow.match(/pull_request:\n([\s\S]*?)\n  workflow_dispatch:/)?.[1] ?? "";
  assert.match(prBlock, /branches:\s*\[prod\]/);
  assert.doesNotMatch(prBlock, /\bdev\b/);
  assert.doesNotMatch(prBlock, /paths-ignore:/, "content and engineering PRs into prod must run Fast CI");
});
