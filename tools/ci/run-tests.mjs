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
  "test/awful-cases-content.test.mjs",
  "test/awful-cases-core.test.mjs",
  "test/awful-cases-game.test.mjs",
  "test/ci-fast-concurrency.test.mjs",
  "test/code-block-contract.test.mjs",
  "test/cms-authoring-topology.test.mjs",
  "test/cms-publication-scope.test.mjs",
  "test/cms-publication-topology.test.mjs",
  "test/cms-publication-workflow.test.mjs",
  "test/css-media-group-foundation.test.mjs",
  "test/css-media-grid-compact.test.mjs",
  "test/css-media-strip-justify-contract.test.mjs",
  "test/css-media-sequence-contract.test.mjs",
  "test/css-media-strip-height-contract.test.mjs",
  "test/css-media-strip-contract.test.mjs",
  "test/css-media-editorial-contract.test.mjs",
  "test/css-media-masonry-contract.test.mjs",
  "test/css-media-bento-contract.test.mjs",
  "test/css-media-fade-input-contract.test.mjs",
  "test/css-media-infinite-reel-contract.test.mjs",
  "test/css-media-group-base-contract.test.mjs",
  "test/css-before-after-contract.test.mjs",
  "test/css-tooling-check.test.mjs",
  "test/cv-principles-lowercase.test.mjs",
  "test/domain-catalog-identity.test.mjs",
  "test/domain-taxonomy-references.test.mjs",
  "test/editorial-content-boundary.test.mjs",
  "test/gallery-renderer.test.mjs",
  "test/gallery-prerelease.test.mjs",
  "test/gallery-navigation-visibility.test.mjs",
  "test/editorial-copy-optional.test.mjs",
  "test/homepage-compact-curation.test.mjs",
  "test/jestei-event-contract.test.mjs",
  "test/lab-vite-config.test.mjs",
  "test/lighthouse-ci-config.test.mjs",
  "test/logo-3d-catalog.test.mjs",
  "test/logo-3d-generator-contract.test.mjs",
  "test/logo-3d-index.test.mjs",
  "test/logo-3d-manifest.test.mjs",
  "test/logo-3d-output-pack.test.mjs",
  "test/logo-3d-source-audit.test.mjs",
  "test/logo-3d-storybook-contract.test.mjs",
  "test/media-desk-cloudflare-auth.test.mjs",
  "test/media-desk-cloudflare-destructive-authority.test.mjs",
  "test/media-desk-cms-asset-resolver.test.mjs",
  "test/media-desk-cms-delete-guard.test.mjs",
  "test/media-desk-destructive-client-authority.test.mjs",
  "test/media-desk-cloudflare-github.test.mjs",
  "test/media-desk-cloudflare-mutations.test.mjs",
  "test/media-desk-cloudflare-assign-endpoint.test.mjs",
  "test/media-desk-cloudflare-github-delete.test.mjs",
  "test/media-desk-cloudflare-domain.test.mjs",
  "test/media-desk-cloudflare-login.test.mjs",
  "test/media-desk-cloudflare-mutation-endpoints.test.mjs",
  "test/media-desk-cloudflare-preview-proxy.test.mjs",
  "test/media-desk-cloudflare-status.test.mjs",
  "test/media-desk-cloudflare-upload-endpoint.test.mjs",
  "test/media-desk-cloudflare-worker.test.mjs",
  "test/media-desk-cover-assignment.test.mjs",
  "test/media-desk-launcher-policy.test.mjs",
  "test/media-desk-model.test.mjs",
  "test/media-desk-page-usage.test.mjs",
  "test/media-desk-page-usage-freshness.test.mjs",
  "test/media-desk-replace-validation.test.mjs",
  "test/media-desk-static-usage-index.test.mjs",
  "test/media-desk-remote-actions.test.mjs",
  "test/media-desk-remote-client.test.mjs",
  "test/media-desk-remote-controls-wiring.test.mjs",
  "test/media-desk-remote-upload-action.test.mjs",
  "test/media-desk-remote-upload-security.test.mjs",
  "test/media-desk-remote-upload-ui-wiring.test.mjs",
  "test/media-desk-utf8-regression.test.mjs",
  "test/media-desk-revision-session.test.mjs",
  "test/media-desk-transaction-invariants.test.mjs",
  "test/media-desk-transactions.test.mjs",
  "test/media-semantic-baseline.test.mjs",
  "test/media-tools/affected-media-ci.test.mjs",
  "test/media-tools/media-cache-fingerprint-scope.test.mjs",
  "test/outreach-link.test.mjs",
  "test/pages-cms-yaml-syntax.test.mjs",
  "test/private-admin-github-oauth.test.mjs",
  // CONTRACT: public GitHub automation must never publish pre-production visual-review evidence.
  "test/public-review-privacy-policy.test.mjs",
  "test/private-lab-shell.test.mjs",
  "test/project-card-hover.test.mjs",
  "test/project-lead-desktop-width.test.mjs",
  "test/repository-growth-policy.test.mjs",
  "test/release-preflight.test.mjs",
  "test/release-verification-temp-root.test.mjs",
  "test/search-presentation.test.mjs",
  // CONTRACT: one document H1 on Home and one textual H1 on every indexable portfolio page.
  "test/seo-heading-structure-contract.test.mjs",
  "test/security-tooling.test.mjs",
  "test/site-analytics-case-end.test.mjs",
  "test/site-analytics-internal.test.mjs",
  "test/site-analytics.test.mjs",
  "test/site-composition.test.mjs",
  "test/site-homepage-presentation.test.mjs",
  "test/standalone-presentation-policy.test.mjs",
  "test/site-pages.test.mjs",
  "test/static-site-analytics.test.mjs",
  "test/stylelint-tooling.test.mjs",
  "test/styx-cms-copy.test.mjs",
  "test/visual-only-renderer-contract.test.mjs",
  "test/webvisor-retained-assets.test.mjs",
  "test/yandex-discovery-contract.test.mjs",
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
