import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const buildWorkflowUrl = new URL("../.github/workflows/preview-v2-build.yml", import.meta.url);
const deployWorkflowUrl = new URL("../.github/workflows/preview-v2-deploy.yml", import.meta.url);

function sliceJob(workflow, name, nextName) {
  const start = workflow.indexOf(`  ${name}:\n`);
  assert.notEqual(start, -1, `missing ${name} job`);
  const end = nextName ? workflow.indexOf(`  ${nextName}:\n`, start + 1) : workflow.length;
  assert.notEqual(end, -1, `missing ${nextName} job after ${name}`);
  return workflow.slice(start, end);
}

test("preview v2 candidate build is exact-SHA, manual-only and unprivileged", async () => {
  const workflow = await readFile(buildWorkflowUrl, "utf8");
  const build = sliceJob(workflow, "build", "package");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /preview_kind:/);
  assert.match(workflow, /preview_key:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /push:/);
  assert.doesNotMatch(workflow, /pull_request_target/);

  assert.match(build, /if:\s*github\.ref\s*==\s*'refs\/heads\/dev'/);
  assert.match(build, /ref:\s*\$\{\{[^}]*target_sha[^}]*\}\}/);
  assert.match(build, /persist-credentials:\s*false/);
  assert.match(build, /node-version:\s*24/);
  assert.match(build, /npm ci/);
  assert.match(build, /npm run typecheck/);
  assert.match(build, /npm run test:fast/);
  assert.match(build, /npm run build:site/);
  assert.match(build, /prepare-cloudflare-pages-v2\.mjs dist/);
  assert.match(build, /name:\s*preview-v2-site/);
  assert.doesNotMatch(build, /preview-metadata\.json/);
  assert.doesNotMatch(build, /preview-metadata\.mjs/);
  assert.doesNotMatch(build, /secrets\./);
});

test("preview v2 packages candidate data in a separate trusted unprivileged job", async () => {
  const workflow = await readFile(buildWorkflowUrl, "utf8");
  const packageJob = sliceJob(workflow, "package");

  assert.match(packageJob, /needs:\s*build/);
  assert.match(packageJob, /if:\s*github\.ref\s*==\s*'refs\/heads\/dev'/);
  assert.match(packageJob, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(packageJob, /path:\s*trusted/);
  assert.match(packageJob, /actions\/download-artifact@v4/);
  assert.match(packageJob, /name:\s*preview-v2-site/);
  assert.match(packageJob, /validate-candidate-artifact\.mjs/);
  assert.match(packageJob, /trusted\/tools\/preview\/preview-metadata\.mjs/);
  assert.match(packageJob, /preview-metadata\.json/);
  assert.match(packageJob, /name:\s*preview-v2-candidate/);
  assert.match(packageJob, /actions\/upload-artifact@v4/);

  assert.doesNotMatch(packageJob, /npm ci/);
  assert.doesNotMatch(packageJob, /npm run/);
  assert.doesNotMatch(packageJob, /node\s+candidate\//);
  assert.doesNotMatch(packageJob, /secrets\./);
});

test("preview v2 deployment is a separate trusted workflow", async () => {
  const workflow = await readFile(deployWorkflowUrl, "utf8");
  const deploy = sliceJob(workflow, "deploy");

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /Preview V2 Build/);
  assert.match(workflow, /types:\s*\[completed\]/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion\s*==\s*'success'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_branch\s*==\s*'dev'/);
  assert.match(deploy, /environment:\s*preview-deploy/);
  assert.match(deploy, /ref:\s*\$\{\{\s*github\.event\.workflow_run\.head_sha\s*\}\}/);
  assert.match(deploy, /actions\/download-artifact@v4|github-script|api\.github\.com/);
  assert.match(deploy, /trusted\/tools\/preview\/preview-metadata\.mjs/);
  assert.match(deploy, /validate-candidate-artifact\.mjs/);
  assert.match(deploy, /assemble-trusted-runtime\.mjs/);
  assert.match(deploy, /previewMetadata:/);
  assert.match(deploy, /PREVIEW_SHA/);
  assert.match(deploy, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(deploy, /secrets\.CLOUDFLARE_API_TOKEN/);

  assert.doesNotMatch(deploy, /metadata\.sha\s*!==\s*expectedSha/);
  assert.doesNotMatch(deploy, /workflow_run\.head_sha[^\n]*metadata\.sha|metadata\.sha[^\n]*workflow_run\.head_sha/);
  assert.doesNotMatch(deploy, /jq -e?r? '\.(?:sha|kind|key|repository)'/);
  assert.doesNotMatch(deploy, /npm ci/);
  assert.doesNotMatch(deploy, /npm run/);
  assert.doesNotMatch(deploy, /node dist\//);
  assert.doesNotMatch(deploy, /source dist\//);
});
