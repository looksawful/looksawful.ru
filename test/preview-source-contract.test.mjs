import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  cmsRefDeleteLeaseArgument,
  planCmsRefGc,
} from "../tools/preview/cms-ref-gc.mjs";
import {
  cmsPreviewLeaseArgument,
  validateCmsSnapshot,
} from "../tools/preview/cms-snapshot.mjs";
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
      { number: 42, state: "open", baseRef: "dev", headRepo: "looksawful/looksawful.ru", headSha: "c".repeat(40) },
      { number: 7, state: "open", baseRef: "dev", headRepo: "looksawful/looksawful.ru", headSha: "b".repeat(40) },
    ],
  });
  assert.equal(plan.baseBranch, "dev");
  assert.equal(plan.targetBranch, "lab");
  assert.deepEqual(plan.prs.map((entry) => entry.number), [7, 42]);
  assert.equal(plan.promotableToDev, false);
});

test("generated Lab rejects forks, closed PRs, wrong-base PRs and non-exact identities", () => {
  const base = { repository: "looksawful/looksawful.ru", devSha: "a".repeat(40) };
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "open", baseRef: "dev", headRepo: "fork/repo", headSha: "b".repeat(40) }] }));
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "closed", baseRef: "dev", headRepo: "looksawful/looksawful.ru", headSha: "b".repeat(40) }] }));
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "open", baseRef: "prod", headRepo: "looksawful/looksawful.ru", headSha: "b".repeat(40) }] }), /target dev/);
  assert.throws(() => planLabComposition({ ...base, selectedPrs: [{ number: 1, state: "open", baseRef: "dev", headRepo: "looksawful/looksawful.ru", headSha: "main" }] }));
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

test("CMS snapshot lease pins the exact previously observed ref state", () => {
  const ref = "refs/heads/cms-preview/styx-copy";
  assert.equal(
    cmsPreviewLeaseArgument(ref, "a".repeat(40)),
    `--force-with-lease=${ref}:${"a".repeat(40)}`,
  );
  assert.equal(cmsPreviewLeaseArgument(ref, null), `--force-with-lease=${ref}:`);
  assert.throws(() => cmsPreviewLeaseArgument(ref, "main"), /exact SHA/);
});

test("Lab composer is source-only and cannot mutate dev or prod", () => {
  const workflow = readFileSync(new URL("../.github/workflows/lab-compose.yml", import.meta.url), "utf8");
  assert.match(workflow, /ref: dev/);
  assert.match(workflow, /\.base\.ref/);
  assert.match(workflow, /lab_expected_sha/);
  assert.match(workflow, /--force-with-lease=refs\/heads\/lab:\$\{\{ steps\.resolve\.outputs\.lab_expected_sha \}\}/);
  assert.match(workflow, /HEAD:refs\/heads\/lab/);
  assert.doesNotMatch(workflow, /HEAD:refs\/heads\/(?:dev|prod)/);
  assert.doesNotMatch(workflow, /CLOUDFLARE|API_TOKEN|ACCOUNT_ID|PASSWORD|SESSION_SECRET/i);
  assert.doesNotMatch(workflow, /repository_dispatch|workflow_dispatch.*awful-control/s);
});

test("CMS ref GC expires at 72h, retains fresh refs and is bounded", () => {
  const now = Date.parse("2026-09-15T00:00:00Z");
  const plan = planCmsRefGc({
    now,
    maxDeletes: 1,
    refs: [
      { ref: "refs/heads/cms-preview/fresh", sha: "a".repeat(40), committed_at: "2026-09-12T01:00:01Z" },
      { ref: "refs/heads/cms-preview/boundary", sha: "b".repeat(40), committed_at: "2026-09-12T00:00:00Z" },
      { ref: "refs/heads/cms-preview/older", sha: "c".repeat(40), committed_at: "2026-09-11T23:00:00Z" },
    ],
  });
  assert.deepEqual(plan.retain.map((item) => item.id), ["fresh"]);
  assert.deepEqual(plan.delete.map((item) => item.id), ["older"]);
  assert.deepEqual(plan.deferred_delete.map((item) => item.id), ["boundary"]);
});

test("CMS ref GC rejects foreign namespaces and stale delete leases", () => {
  assert.throws(() => planCmsRefGc({ refs: [{ ref: "refs/heads/dev", sha: "a".repeat(40), committed_at: "2026-09-01T00:00:00Z" }] }), /namespace/);
  const ref = "refs/heads/cms-preview/styx-copy";
  assert.equal(cmsRefDeleteLeaseArgument(ref, "a".repeat(40)), `--force-with-lease=${ref}:${"a".repeat(40)}`);
  assert.throws(() => cmsRefDeleteLeaseArgument("refs/heads/lab", "a".repeat(40)), /namespace/);
  assert.throws(() => cmsRefDeleteLeaseArgument(ref, "main"), /exact SHA/);
});

test("CMS ref GC workflow is source-only, scheduled and lease-protected", () => {
  const workflow = readFileSync(new URL("../.github/workflows/cms-preview-ref-gc.yml", import.meta.url), "utf8");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /dry_run:/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /cmsRefDeleteLeaseArgument/);
  assert.match(workflow, /git push "\$lease" origin ":\$ref"/);
  assert.match(workflow, /refs\/heads\/cms-preview\//);
  assert.doesNotMatch(workflow, /refs\/heads\/(?:dev|prod|lab)/);
  assert.doesNotMatch(workflow, /CLOUDFLARE|API_TOKEN|ACCOUNT_ID|PASSWORD|SESSION_SECRET/i);
});

test("Preview Source Contract watches CMS ref GC workflow changes", () => {
  const workflow = readFileSync(new URL("../.github/workflows/preview-source-contract.yml", import.meta.url), "utf8");
  assert.match(workflow, /\.github\/workflows\/cms-preview-ref-gc\.yml/);
});
