import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    /Build isolated Private Lab[\s\S]*?Prune Cloudflare-incompatible Lab-only assets[\s\S]*?find dist-lab\/media\/projects -type f -path '\*\/source\/\*' -size \+26214400c -print0[\s\S]*?dist-lab\/media\/projects\/index\/2\.png[\s\S]*?dist-lab\/media\/generated\/video\/projects\/sensetique\/11\/source\/97-16x9\.web\.mp4[\s\S]*?Enforce Cloudflare Pages asset size limit[\s\S]*?find dist-lab -type f -size \+26214400c -print -quit[\s\S]*?Deploy Private Lab with Pages Functions/u,
  );
  assert.match(workflow, /npm run lab:build/u);
  assert.match(workflow, /working-directory:\s*lab/u);
  assert.match(workflow, /wrangler@4 pages deploy \.\.\/dist-lab/u);
  assert.match(workflow, /admin\.looksawful\.ru/u);
  assert.match(workflow, /PRIVATE_LAB_ZONE:\s*looksawful\.ru/u);
  assert.match(workflow, /Ensure Private Lab DNS record/u);
  assert.match(workflow, /client\/v4\/zones\?name=\$\{PRIVATE_LAB_ZONE\}&account\.id=\$\{CLOUDFLARE_ACCOUNT_ID\}/u);
  assert.match(workflow, /\/dns_records/u);
  assert.match(workflow, /type:"CNAME"/u);
  assert.match(workflow, /proxied:true/u);
  assert.match(workflow, /api\.cloudflare\.com\/client\/v4\/accounts/u);
  assert.match(workflow, /\/pages\/projects\/\$\{PRIVATE_LAB_PROJECT\}\/domains/u);
  assert.match(workflow, /\/lab\/system\//u);
  assert.match(workflow, /\/auth\/github/u);
});


test("Cloudflare Pages size gate accepts 25 MiB and rejects one byte over", async (t) => {
  if (process.platform === "win32") {
    t.skip("GNU find size semantics are verified in Linux CI");
    return;
  }

  const workflow = await readFile(workflowUrl, "utf8");
  const sizeExpression = workflow.match(
    /find dist-lab -type f -size (\+\d+c) -print -quit/u,
  )?.[1];
  assert.ok(sizeExpression, "workflow must define the Pages size expression");

  const root = mkdtempSync(join(tmpdir(), "private-lab-size-"));
  const dist = join(root, "dist-lab");
  const asset = join(dist, "asset.bin");

  try {
    mkdirSync(dist, { recursive: true });
    writeFileSync(asset, "");

    truncateSync(asset, 26_214_400);
    let output = execFileSync(
      "find",
      ["dist-lab", "-type", "f", "-size", sizeExpression, "-print", "-quit"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(output.trim(), "");

    truncateSync(asset, 26_214_401);
    output = execFileSync(
      "find",
      ["dist-lab", "-type", "f", "-size", sizeExpression, "-print", "-quit"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(output.trim(), "dist-lab/asset.bin");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
