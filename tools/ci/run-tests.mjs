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
  "test/ci-fast-concurrency.test.mjs",
  "test/cms-publication-scope.test.mjs",
  "test/cms-publication-topology.test.mjs",
  "test/cms-publication-workflow.test.mjs",
  "test/domain-catalog-identity.test.mjs",
  "test/domain-taxonomy-references.test.mjs",
  "test/editorial-content-boundary.test.mjs",
  "test/editorial-copy-optional.test.mjs",
  "test/jestei-theme-static-runtime-types.test.mjs",
  "test/lighthouse-ci-config.test.mjs",
  "test/media-tools/media-cache-fingerprint-scope.test.mjs",
  "test/pages-cms-yaml-syntax.test.mjs",
  "test/site-analytics.test.mjs",
  "test/site-composition.test.mjs",
  "test/site-pages.test.mjs",
  "test/static-site-analytics.test.mjs",
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

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const files = readdirSync("test", { recursive: true }).map(
    (file) => `test/${file.replaceAll("\\", "/")}`,
  );
  const selected = selectTests(process.argv[2], files);
  if (!selected.length) throw new Error("test group is empty");
  const result = spawnSync(process.execPath, ["--test", ...selected], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
