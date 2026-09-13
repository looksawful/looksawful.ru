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

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /preview_kind:/);
  assert.match(workflow, /preview_key:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /push:/);
  assert.doesNotMatch(workflow, /pull_request_target/);

  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /ref:\s*\$\{\{[^}]*target_sha[^}]*\}\}/);
  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /npm run build:site/);
  assert.match(workflow, /prepare-cloudflare-pages\.mjs dist/);
  assert.match(workflow, /preview-metadata\.json/);
  assert.match(workflow, /actions\/upload-artifact@v4/);

  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_/);
  assert.doesNotMatch(workflow, /PREVIEW_PASSWORD|PREVIEW_SESSION_SECRET|PREVIEW_CI_TOKEN/);
});

test("preview v2 deployment is a separate trusted workflow", async () => {
  const workflow = await readFile(deployWorkflowUrl, "utf8");
  const deploy = sliceJob(workflow, "deploy");

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /Preview V2 Build/);
  assert.match(workflow, /types:\s*\[completed\]/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion\s*==\s*'success'/);
  assert.match(deploy, /environment:\s*preview-deploy/);
  assert.match(deploy, /actions\/download-artifact@v4|github-script|api\.github\.com/);
  assert.match(deploy, /validate-candidate-artifact\.mjs/);
  assert.match(deploy, /assemble-trusted-runtime\.mjs/);
  assert.match(deploy, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(deploy, /secrets\.CLOUDFLARE_API_TOKEN/);

  assert.doesNotMatch(deploy, /npm ci/);
  assert.doesNotMatch(deploy, /npm run/);
  assert.doesNotMatch(deploy, /node dist\//);
  assert.doesNotMatch(deploy, /source dist\//);
});
