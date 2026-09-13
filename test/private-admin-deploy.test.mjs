import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/private-admin-deploy.yml", import.meta.url);

async function readWorkflow() {
  return readFile(workflowUrl, "utf8");
}

test("private Admin deploy runs only from trusted dev integration or manual dispatch", async () => {
  const workflow = await readWorkflow();

  assert.match(workflow, /name:\s*Private Admin Deploy/i);
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[dev\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /branches:\s*\[prod\]/);
  assert.match(workflow, /permissions:\s*[\s\S]*contents:\s*read/);
});

test("private Admin deployment stages Pages Functions and Cloudflare runtime secrets", async () => {
  const workflow = await readWorkflow();

  assert.match(workflow, /looksawful-ru-admin/);
  assert.match(workflow, /production_branch[^\n]*dev|production-branch[=:\s]+dev/i);
  assert.match(workflow, /lab\/functions/);
  assert.match(workflow, /\bfunctions\b/);
  assert.match(workflow, /ADMIN_GITHUB_CLIENT_ID/);
  assert.match(workflow, /ADMIN_GITHUB_CLIENT_SECRET/);
  assert.match(workflow, /ADMIN_SESSION_SECRET/);
  assert.match(workflow, /pages secret bulk/);
  assert.match(workflow, /pages deploy dist-lab/);
  assert.doesNotMatch(workflow, /LAB_PASSWORD|cloudflare access|zero trust/i);
  assert.doesNotMatch(workflow, /set\s+-[^\n]*x/);
  assert.doesNotMatch(
    workflow,
    /(?:echo|printf)[^\n]*\$(?:\{)?ADMIN_(?:GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET|SESSION_SECRET)/i,
  );
});

test("private Admin deployment provisions and smoke-verifies admin.looksawful.ru", async () => {
  const workflow = await readWorkflow();

  assert.match(workflow, /admin\.looksawful\.ru/);
  assert.match(
    workflow,
    /pages\/projects\/\$\{?CLOUDFLARE_PAGES_PROJECT\}?\/domains|pages\/projects\/[^\n]+\/domains/,
  );
  assert.match(workflow, /Authorization:\s*Bearer \$\{?CLOUDFLARE_API_TOKEN\}?/);
  assert.doesNotMatch(workflow, /dns_records/i);
  assert.match(workflow, /auth\/github/);
  assert.match(workflow, /https:\/\/github\.com\/login\/oauth\/authorize/);
  assert.match(workflow, /X-Robots-Tag|x-robots-tag/);
  assert.match(workflow, /private, no-store/i);
  assert.match(workflow, /\.pages\.dev\/auth\/github/);
  assert.match(workflow, /403/);
});
