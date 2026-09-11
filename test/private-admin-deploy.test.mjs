import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/private-admin-deploy.yml", import.meta.url),
  "utf8",
);

test("private Admin deploys only from trusted dev integration, never from pull requests", () => {
  assert.match(workflow, /name:\s*Private Admin Deploy/i);
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[dev\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /branches:\s*\[prod\]/);
  assert.match(workflow, /permissions:\s*[\s\S]*contents:\s*read/);
});

test("private Admin deploy stages Pages Functions and encrypted runtime secrets before deployment", () => {
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
  assert.doesNotMatch(workflow, /echo[^\n]*ADMIN_(?:GITHUB|SESSION)/i);
});

test("private Admin deploy provisions and verifies admin.looksawful.ru without manual DNS instructions", () => {
  assert.match(workflow, /admin\.looksawful\.ru/);
  assert.match(
    workflow,
    /pages\/projects\/\$\{?CLOUDFLARE_PAGES_PROJECT\}?\/domains|pages\/projects\/[^\n]+\/domains/,
  );
  assert.match(workflow, /Authorization:\s*Bearer \$\{?CLOUDFLARE_API_TOKEN\}?/);
  assert.match(workflow, /auth\/github/);
  assert.match(workflow, /github\.com\/login\/oauth\/authorize/);
  assert.match(workflow, /X-Robots-Tag|x-robots-tag/);
  assert.match(workflow, /private, no-store/i);
  assert.match(workflow, /\.pages\.dev\/auth\/github/);
  assert.match(workflow, /403/);
});
