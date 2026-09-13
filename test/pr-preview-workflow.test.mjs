import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/pr-preview.yml", import.meta.url);
const docsUrl = new URL("../docs/pr-preview.md", import.meta.url);

function sliceJob(workflow, name, nextName) {
  const start = workflow.indexOf(`  ${name}:\n`);
  assert.notEqual(start, -1, `missing ${name} job`);
  const end = nextName ? workflow.indexOf(`  ${nextName}:\n`, start + 1) : workflow.length;
  assert.notEqual(end, -1, `missing ${nextName} job after ${name}`);
  return workflow.slice(start, end);
}

test("PR preview keeps candidate execution separate from Cloudflare credentials", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  const build = sliceJob(workflow, "build", "deploy");
  const deploy = sliceJob(workflow, "deploy", "remote-qa");
  const remoteQa = sliceJob(workflow, "remote-qa");

  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /preview_number:/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha/);

  assert.match(build, /npm ci/);
  assert.match(build, /npm run typecheck/);
  assert.match(build, /npm run test:fast/);
  assert.match(build, /npm run build:site/);
  assert.match(build, /build-preview-assistant-worker\.mjs/);
  assert.match(build, /prepare-cloudflare-pages\.mjs dist/);
  assert.match(build, /without deleting sources/i);
  assert.match(build, /actions\/upload-artifact@v4/);
  assert.match(build, /file_count > 20000/);
  assert.match(build, /\+26214400c/);
  assert.doesNotMatch(build, /secrets\.CLOUDFLARE_/);

  assert.match(deploy, /actions\/download-artifact@v4/);
  assert.match(deploy, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(deploy, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(deploy, /secrets\.YANDEX_AI_API_KEY/);
  assert.match(deploy, /pages secret put YANDEX_AI_API_KEY/);
  assert.match(deploy, /--branch=pr-\$\{\{ env\.PR_NUMBER \}\}/);
  assert.doesNotMatch(deploy, /--branch=prod/);
  assert.doesNotMatch(deploy, /npm ci|npm run/);
  assert.match(deploy, /preview-version\.txt/);
  assert.match(deploy, /preview-media-manifest\.json/);
  assert.match(deploy, /oversized preview media routes remain reachable/i);
  assert.match(deploy, /x-robots-tag:\[\[:space:\]\]\*noindex/i);
  assert.match(deploy, /PREVIEW_URL: \$\{\{ steps\.deploy\.outputs\.deployment-url \}\}/);

  assert.match(remoteQa, /npm ci/);
  assert.match(remoteQa, /playwright install --with-deps chromium/);
  assert.match(remoteQa, /runProductionE2E/);
  assert.doesNotMatch(remoteQa, /secrets\.CLOUDFLARE_/);
  assert.match(remoteQa, /PREVIEW_URL: \$\{\{ needs\.deploy\.outputs\.preview_url \}\}/);
  assert.match(remoteQa, /PREVIEW_ALIAS_URL: \$\{\{ needs\.deploy\.outputs\.preview_alias_url \}\}/);
  assert.match(remoteQa, /manual visual approval/);

  assert.doesNotMatch(workflow, /VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN|VITE_YANDEX_METRIKA_COUNTER_ID/);
});

test("preview documentation preserves release gate and repository media sources", async () => {
  const docs = await readFile(docsUrl, "utf8");
  assert.match(docs, /no merge\/deployment to `prod` until the exact candidate preview has been manually approved/i);
  assert.match(docs, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(docs, /CLOUDFLARE_API_TOKEN/);
  assert.match(docs, /manual exact-SHA mode/i);
  assert.match(docs, /repository remains the source of truth for original media/i);
  assert.match(docs, /only the temporary copy inside `dist` is removed/i);
  assert.match(docs, /preview-only surrogate/i);
  assert.match(docs, /must never make an unknown file disappear/i);
});
