import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateCmsSnapshot } from "../tools/preview/cms-snapshot.mjs";
import {
  DEFAULT_CMS_PREVIEW_TTL_HOURS,
  normalizeSelectedPrNumbers,
  planCmsPreview,
  planLabComposition,
} from "../tools/preview/source-contract.mjs";

test("generated Lab starts from dev and orders explicit same-repo PRs deterministically", () => {
  const plan = planLabComposition({
    repository: "looksawful/looksawful.ru",
    devSha: "a".repeat(40),
    selectedPrs: [
      { number: 42, state: "open", headRepo: "looksawful/looksawful.ru", headSha: "c".repeat(40) },
      { number: 7, state: "open", headRepo: "looksawful/looksawful.ru", headSha: "b".repeat(40) },
    ],
  });
  assert.equal(plan.baseBranch, "dev");
  assert.equal(plan.targetBranch, "lab");
  assert.deepEqual(plan.prs.map((entry) => entry.number), [7, 42]);
  assert.equal(plan.promotableToDev, false);
});

test("generated Lab rejects forks, closed PRs and non-exact identities", () => {
  const base = { repository: "looksawful/looksawful.ru", devSha: "a".repeat(40) };
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "open", headRepo: "fork/repo", headSha: "b".repeat(40) }] }));
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "closed", headRepo: "looksawful/looksawful.ru", headSha: "b".repeat(40) }] }));
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "open", headRepo: "looksawful/looksawful.ru", headSha: "main" }] }));
});

test("selected PR input is bounded, unique and sorted", () => {
  assert.deepEqual(normalizeSelectedPrNumbers(["12", 3, "12", 9]), [3, 9, 12]);
  assert.throws(() => normalizeSelectedPrNumbers([0]));
  assert.throws(() => normalizeSelectedPrNumbers(["wat"]));
});

test("CMS preview defaults to dev, 72h, authorized files and no publish authority", () => {
  const plan = planCmsPreview({
    id: "styx-copy-1",
    changedPaths: ["content/editorial/styx.json"],
    authorizedPrefixes: ["content/editorial/"],
  });
  assert.equal(plan.ref, "cms-preview/styx-copy-1");
  assert.equal(plan.baseBranch, "dev");
  assert.equal(plan.ttlHours, DEFAULT_CMS_PREVIEW_TTL_HOURS);
  assert.equal(plan.publishAuthority, false);
});

test("CMS preview requires explicit advanced mode for lab and rejects unauthorized paths", () => {
  assert.throws(() => planCmsPreview({ id: "x", baseBranch: "lab", changedPaths: [], authorizedPrefixes: [], allowLabBase: false }));
  assert.equal(planCmsPreview({ id: "x", baseBranch: "lab", changedPaths: [], authorizedPrefixes: [], allowLabBase: true }).baseBranch, "lab");
  assert.throws(() => planCmsPreview({ id: "x", changedPaths: ["src/main.ts"], authorizedPrefixes: ["content/"] }));
});

test("CMS snapshot reuses fail-closed publication scope", () => {
  const safe = validateCmsSnapshot({ id: "styx-copy", files: ["src/content/cases/styx.json"] });
  assert.equal(safe.plan.baseBranch, "dev");
  assert.equal(safe.scope.safe, true);
  assert.throws(() => validateCmsSnapshot({ id: "code", files: ["src/main.ts"] }), /blocked/);
  assert.throws(() => validateCmsSnapshot({ id: "unknown", files: ["src/content/new-unconfigured.json"] }), /blocked/);
});

test("Lab composer is source-only and cannot mutate dev or prod", () => {
  const workflow = readFileSync(new URL("../.github/workflows/lab-compose.yml", import.meta.url), "utf8");
  assert.match(workflow, /ref: dev/);
  assert.match(workflow, /HEAD:refs\/heads\/lab/);
  assert.doesNotMatch(workflow, /HEAD:refs\/heads\/(?:dev|prod)/);
  assert.doesNotMatch(workflow, /CLOUDFLARE|API_TOKEN|ACCOUNT_ID|PASSWORD|SESSION_SECRET/i);
  assert.doesNotMatch(workflow, /repository_dispatch|workflow_dispatch.*awful-control/s);
});
