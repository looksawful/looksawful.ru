import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/private-lab-deploy.yml", import.meta.url);

test("private Lab deploy is dev-only, authenticated, and Cloudflare-backed", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /branches:\s*\[dev\]/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.doesNotMatch(workflow, /pull_request(?:_target)?:/u);
  assert.match(
    workflow,
    /^permissions:\n  contents: read\n\n/mu,
    "workflow permissions must be exactly contents: read",
  );
  assert.equal(
    (workflow.match(/^\s*permissions:/gmu) ?? []).length,
    1,
    "no job-level permission overrides",
  );
  assert.match(workflow, /github\.ref == 'refs\/heads\/dev'/u);
  assert.doesNotMatch(workflow, /continue-on-error:/u);

  const deployHeader = workflow.match(/\n  deploy:\n([\s\S]*?)\n    steps:\n/u)?.[1] ?? "";

  for (const secret of [
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "ADMIN_GITHUB_CLIENT_ID",
    "ADMIN_GITHUB_CLIENT_SECRET",
    "ADMIN_SESSION_SECRET",
  ]) {
    assert.equal(workflow.includes("secrets." + secret), true, "missing " + secret);
    assert.equal(
      deployHeader.includes("secrets." + secret),
      false,
      secret + " must not be job-scoped",
    );
  }

  assert.match(
    workflow,
    /Install media tooling[\s\S]*?apt-get install -y ffmpeg[\s\S]*?Prepare production-backed media fixtures[\s\S]*?npm run media:ensure/u,
  );
  assert.match(
    workflow,
    /Build isolated Private Lab[\s\S]*?Prune Cloudflare-incompatible oversized Lab assets[\s\S]*?find dist-lab -type f -size \+26214400c -print0[\s\S]*?Enforce Cloudflare Pages asset size limit[\s\S]*?find dist-lab -type f -size \+26214400c -print -quit[\s\S]*?Deploy Private Lab with Pages Functions/u,
  );
  assert.match(workflow, /npm run lab:build/u);
  assert.match(workflow, /working-directory:\s*lab/u);
  assert.match(workflow, /wrangler@4 pages deploy \.\.\/dist-lab/u);
  assert.match(workflow, /admin\.looksawful\.ru/u);
  assert.match(workflow, /api\.cloudflare\.com\/client\/v4\/accounts/u);
  assert.match(workflow, /\/pages\/projects\/\$\{PRIVATE_LAB_PROJECT\}\/domains/u);
  assert.match(workflow, /\/lab\/system\//u);
  assert.match(workflow, /\/auth\/github/u);
});
