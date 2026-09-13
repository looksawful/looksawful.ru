import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const derivativeTests = new Set([
  "test/responsive-manifest-contract.test.mjs",
  "test/video-delivery-contract.test.mjs",
]);

// Fast CI is intentionally opt-in. New test files stay out until they are
// explicitly justified as cheap, long-lived contracts under docs/testing-policy.md.
export const fastTests = new Set([
  "test/agent-verification-workflow.test.mjs",
  "test/awful-cases-cms-editorial.test.mjs",
  "test/ci-fast-concurrency.test.mjs",
  "test/code-block-contract.test.mjs",
  "test/cms-publication-scope.test.mjs",
  "test/cms-publication-topology.test.mjs",
  "test/cms-publication-workflow.test.mjs",
  "test/css-refactor-wave5b-media-group-foundation.test.mjs",
  "test/css-refactor-wave5c-grid-compact.test.mjs",
  "test/css-refactor-wave5d-strip-justify-contract.test.mjs",
  "test/css-refactor-wave5e-sequence.test.mjs",
  "test/css-refactor-wave5f-strip-height-contract.test.mjs",
  "test/css-refactor-wave5g-strip.test.mjs",
  "test/css-refactor-wave5h-editorial.test.mjs",
  "test/css-refactor-wave5i-masonry.test.mjs",
  "test/css-refactor-wave5j-bento.test.mjs",
  "test/css-refactor-wave5k-fade-input.test.mjs",
  "test/css-refactor-wave5k-infinite-reel.test.mjs",
  "test/css-refactor-wave5l-media-group-base.test.mjs",
  "test/css-refactor-wave6a-before-after.test.mjs",
  "test/css-tooling-check.test.mjs",
  "test/cv-principles-lowercase.test.mjs",
  "test/domain-catalog-identity.test.mjs",
  "test/domain-taxonomy-references.test.mjs",
  "test/editorial-content-boundary.test.mjs",
  "test/editorial-copy-optional.test.mjs",
  "test/gallery-prerelease.test.mjs",
  "test/gallery-renderer.test.mjs",
  "test/jestei-event-migration.test.mjs",
  "test/lighthouse-ci-config.test.mjs",
  "test/media-tools/affected-media-ci.test.mjs",
  "test/media-tools/media-cache-fingerprint-scope.test.mjs",
  "test/pages-cms-yaml-syntax.test.mjs",
  "test/pr-preview-media-packaging.test.mjs",
  "test/pr-preview-workflow.test.mjs",
  "test/project-card-hover.test.mjs",
  "test/repository-growth-policy.test.mjs",
  "test/search-presentation.test.mjs",
  "test/security-tooling.test.mjs",
  "test/site-analytics.test.mjs",
  "test/site-composition.test.mjs",
  "test/site-pages.test.mjs",
  "test/static-site-analytics.test.mjs",
  "test/stylelint-tooling.test.mjs",
  "test/styx-cms-copy.test.mjs",
]);

const ciTests = new Set([
  "test/change-scope.test.mjs",
  "test/ci-fast-concurrency.test.mjs",
  "test/ci-minimal-pipeline.test.mjs",
  "test/ci-pipeline.test.mjs",
  "test/cms-publication-scope.test.mjs",
  "test/cms-publication-topology.test.mjs",
  "test/cms-publication-workflow.test.mjs",
  "test/e2e-concurrency.test.mjs",
  "test/e2e-production-pipeline.test.mjs",
  "test/e2e-readiness-contract.test.mjs",
  "test/lighthouse-ci-config.test.mjs",
  "test/media-ci-cache.test.mjs",
  "test/media-routing.test.mjs",
  "test/media-tools/affected-media-ci.test.mjs",
  "test/production-media-cache.test.mjs",
  "test/test-groups.test.mjs",
  "test/tooling-pipeline.test.mjs",
]);

export function selectTests(group, files) {
  const tests = files.filter((file) => file.endsWith(".test.mjs")).sort();

  if (group === "fast") {
    return tests.filter((file) => fastTests.has(file));
  }

  // Broad cheap Node coverage remains available for manual/scheduled use.
  if (group === "unit") {
    return tests.filter(
      (file) => !file.startsWith("test/media-tools/") && !derivativeTests.has(file),
    );
  }

  if (group === "media-contract") {
    return tests.filter((file) => derivativeTests.has(file));
  }

  if (group === "media") {
    return tests.filter((file) => /^test\/(media-|responsive-|video-delivery)/.test(file));
  }

  if (group === "cv") {
    return tests.filter((file) => /^test\/cv-/.test(file));
  }

  if (group === "ci") {
    return tests.filter((file) => ciTests.has(file));
  }

  throw new Error(`unknown test group: ${group}`);
}

export function runTests(group) {
  const testRoot = fileURLToPath(new URL("../../test/", import.meta.url));
  const files = readdirSync(testRoot, { recursive: true })
    .filter((file) => typeof file === "string")
    .map((file) => `test/${file.replaceAll(path.sep, "/")}`);
  const selected = selectTests(group, files);

  if (!selected.length) {
    console.error(`No tests selected for group: ${group}`);
    process.exitCode = 1;
    return;
  }

  const result = spawnSync(process.execPath, ["--test", ...selected], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    stdio: "inherit",
  });

  process.exitCode = result.status ?? 1;
}

const group = process.argv[2];

if (group) {
  runTests(group);
}
