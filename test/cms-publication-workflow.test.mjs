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

test("Pages CMS dispatches publication authorization from trusted prod, never current dev", async () => {
  const cms = await read(".pages.yml");
  const action = publicationAction(cms);
  assert.match(action, /workflow: pages-cms-publish\.yml/);
  assert.match(action, /ref: prod\b/);
  assert.doesNotMatch(action, /ref: current\b/);
});

test("publication workflow separates CMS source dev from trusted execution ref prod", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /source_ref/);
  assert.match(workflow, /source_ref[^\n]*!= "dev"|"\$source_ref" != "dev"/);
  assert.match(workflow, /WORKFLOW_REF/);
  assert.match(workflow, /WORKFLOW_REF[^\n]*!= "prod"|"\$WORKFLOW_REF" != "prod"/);
  assert.doesNotMatch(workflow, /WORKFLOW_REF[^\n]*!= "dev"|"\$WORKFLOW_REF" != "dev"/);
});

test("publication workflow validates content-aware topology before scope authorization", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /git fetch --no-tags --depth=1 origin/);
  assert.match(workflow, /refs\/heads\/prod:refs\/remotes\/origin\/prod/);
  assert.match(workflow, /refs\/heads\/dev:refs\/remotes\/origin\/dev/);
  assert.match(workflow, /node tools\/cms-publication-topology\.mjs[\s\S]*--prod origin\/prod[\s\S]*--dev origin\/dev/);
  assert.doesNotMatch(workflow, /git merge-base --is-ancestor origin\/prod origin\/dev/);
  assert.match(workflow, /steps\.topology\.outputs\.nothing_to_publish != 'true'/);

  const topology = workflow.indexOf("cms-publication-topology.mjs");
  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  assert.ok(topology !== -1, "content-aware topology guard must be invoked");
  assert.ok(topology < classifier, "topology must be authorized before path classification");
});

test("trusted classifier sees both sides of renames and runs before PR operations", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /cms-publication-scope\.mjs/);
  assert.match(workflow, /prod\.\.\.dev|origin\/prod\.\.origin\/dev|origin\/prod\.\.\.origin\/dev/);
  assert.match(workflow, /git[\s\S]*diff[\s\S]*--name-only[\s\S]*--no-renames[\s\S]*-z[\s\S]*origin\/prod\.\.origin\/dev/);

  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  const list = workflow.indexOf("gh pr list");
  const create = workflow.indexOf("gh pr create");
  assert.ok(classifier !== -1, "publication classifier must be invoked");
  assert.ok(list !== -1 && classifier < list, "current diff must pass classifier before an existing PR is reused");
  assert.ok(create !== -1 && classifier < create, "current diff must pass classifier before PR creation");
});

test("publication prepares or reuses the PR and stops without checks, merge, deploy, or prod mutation", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: write/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.doesNotMatch(workflow, /checks: read|statuses: read/);
  assert.match(workflow, /gh pr list/);
  assert.match(workflow, /gh pr create/);
  assert.match(workflow, /Publication PR prepared/);
  assert.doesNotMatch(workflow, /Wait for publication verification|Merge verified CMS publication/);
  assert.doesNotMatch(workflow, /gh pr checks/);
  assert.doesNotMatch(workflow, /EXPECTED_DEV_SHA|headRefOid/);
  assert.doesNotMatch(workflow, /repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}\/merge/);
  assert.doesNotMatch(workflow, /actions\/deploy-pages|git push[^\n]*prod/);
});

test("text-only CMS saves are silent on dev while publication PRs always run Fast CI", async () => {
  const workflow = await read(".github/workflows/ci-fast.yml");
  const pushBlock = workflow.match(/push:\n([\s\S]*?)\n  pull_request:/)?.[1] ?? "";
  const prBlock = workflow.match(/pull_request:\n([\s\S]*?)\n  workflow_dispatch:/)?.[1] ?? "";

  for (const path of [
    "src/content/editorial/cv.json",
    "src/content/editorial/home-project-cards.json",
    "src/content/navigation.json",
    "src/content/cases/**",
    "src/content/collections/shootings.json",
    "src/content/shootings/**",
    "src/content/standalone-projects/**",
  ]) {
    assert.match(pushBlock, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.doesNotMatch(prBlock, /paths-ignore:/, "publication and engineering PRs must run Fast CI even for editorial-only diffs");
});
