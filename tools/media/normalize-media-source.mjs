import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const APPLY = process.argv.includes("--apply");
const SNAPSHOT = ".cache/media-normalization/live-semantics-before.json";
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

function nodeStep(label, script, args = [], options = {}) {
  return {
    label,
    command: process.execPath,
    args: [script, ...args],
    allowStatuses: options.allowStatuses ?? [0],
  };
}

function npmStep(label, script) {
  return {
    label,
    command: NPM,
    args: ["run", script],
    allowStatuses: [0],
  };
}

export function buildNormalizationSteps({ apply }) {
  if (!apply) {
    return [
      nodeStep(
        "check-materialized-entry-context",
        "tools/media/materialize-entry-context.mjs",
        [],
        { allowStatuses: [0, 1] },
      ),
      nodeStep("logical-dedupe-dry-run", "tools/media/apply-dedupe-migration.mjs"),
      nodeStep(
        "deferred-physical-dedupe-dry-run",
        "tools/media/apply-deferred-physical-dedupe.mjs",
      ),
      nodeStep(
        "check-pages-cms-compact",
        "tools/media/compact-pages-cms-media-catalog.mjs",
        [],
        { allowStatuses: [0, 1] },
      ),
    ];
  }

  return [
    nodeStep("capture-live-semantics", "tools/media/live-semantic-snapshot.mjs", ["--write", SNAPSHOT]),
    nodeStep("materialize-entry-context", "tools/media/materialize-entry-context.mjs", ["--write"]),
    nodeStep("check-materialized-entry-context", "tools/media/materialize-entry-context.mjs"),
    nodeStep("verify-semantics-after-materialize", "tools/media/live-semantic-snapshot.mjs", ["--check", SNAPSHOT]),
    nodeStep("logical-dedupe-dry-run", "tools/media/apply-dedupe-migration.mjs"),
    nodeStep("logical-dedupe-apply", "tools/media/apply-dedupe-migration.mjs", ["--apply"]),
    nodeStep("deferred-physical-dedupe-dry-run", "tools/media/apply-deferred-physical-dedupe.mjs"),
    nodeStep("deferred-physical-dedupe-apply", "tools/media/apply-deferred-physical-dedupe.mjs", ["--apply"]),
    nodeStep("compact-pages-cms", "tools/media/compact-pages-cms-media-catalog.mjs", ["--write"]),
    nodeStep("check-pages-cms-compact", "tools/media/compact-pages-cms-media-catalog.mjs"),
    npmStep("media-catalog-sync", "media:catalog:sync"),
    npmStep("responsive-media-build", "media:build"),
    nodeStep("media-dev-state-write", "tools/media-dev-state.mjs", ["--write"]),
    nodeStep("verify-live-semantics-final", "tools/media/live-semantic-snapshot.mjs", ["--check", SNAPSHOT]),
    nodeStep("dedupe-integrity", "tools/media/check-dedupe-integrity.mjs"),
    npmStep("typecheck", "typecheck"),
    npmStep("media-tests", "test:media:checks"),
    npmStep("fast-tests", "test:fast"),
    npmStep("site-build", "build:site"),
  ];
}

function runStep(step) {
  process.stdout.write(`\n[media-normalize] >>> ${step.label}\n`);
  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  const status = result.status ?? 1;
  if (!step.allowStatuses.includes(status)) {
    throw new Error(`[media-normalize] ${step.label} failed with exit ${status}`);
  }
  process.stdout.write(`[media-normalize] <<< ${step.label}: exit ${status}\n`);
  return status;
}

async function main() {
  const steps = buildNormalizationSteps({ apply: APPLY });
  const results = [];
  for (const step of steps) {
    results.push({ label: step.label, status: runStep(step) });
  }
  process.stdout.write(`\n${JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    steps: results,
  }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
