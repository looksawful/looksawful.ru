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

test("publication workflow blocks non-linear branch topology before scope authorization", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /git fetch --no-tags origin[\s\S]*refs\/heads\/prod:refs\/remotes\/origin\/prod[\s\S]*refs\/heads\/dev:refs\/remotes\/origin\/dev/);
  assert.match(workflow, /git rev-parse origin\/prod/);
  assert.match(workflow, /git rev-parse origin\/dev/);
  assert.match(workflow, /Nothing to publish|no unpublished dev commits/i);
  assert.match(workflow, /git merge-base --is-ancestor origin\/prod origin\/dev/);
  assert.match(workflow, /dev is not a linear descendant of prod/i);

  const equalCheck = workflow.indexOf('if [[ "$prod_sha" == "$dev_sha" ]]');
  const ancestorCheck = workflow.indexOf("git merge-base --is-ancestor");
  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  assert.ok(equalCheck !== -1 && equalCheck < ancestorCheck, "equal/no-op check must happen before ancestry authorization");
  assert.ok(ancestorCheck < classifier, "topology must be authorized before path classification");
});

test("trusted classifier runs before existing-PR lookup and PR creation", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /cms-publication-scope\.mjs/);
  assert.match(workflow, /prod\.\.\.dev|origin\/prod\.\.origin\/dev|origin\/prod\.\.\.origin\/dev/);

  const classifier = workflow.indexOf("cms-publication-scope.mjs");
  const list = workflow.indexOf("gh pr list");
  const create = workflow.indexOf("gh pr create");
  assert.ok(classifier !== -1, "publication classifier must be invoked");
  assert.ok(list !== -1 && classifier < list, "current diff must pass classifier before an existing PR is reused");
  assert.ok(create !== -1 && classifier < create, "current diff must pass classifier before PR creation");
});

test("publication workflow preserves reviewable PR-only behavior and never merges or deploys", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /gh pr create/);
  assert.doesNotMatch(workflow, /gh pr merge|actions\/deploy-pages|git push[^\n]*prod/);
});
