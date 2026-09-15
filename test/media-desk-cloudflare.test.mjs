import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

test("Media Desk has isolated Cloudflare build and dry-run scripts", () => {
  assert.equal(typeof packageJson.scripts["media-desk:build"], "string");
  assert.match(packageJson.scripts["media-desk:build"], /tools\/cloudflare\/media-desk\/build\.mjs/);
  assert.equal(typeof packageJson.scripts["media-desk:cf:dry-run"], "string");
  assert.match(packageJson.scripts["media-desk:cf:dry-run"], /wrangler.*--dry-run/i);
  assert.doesNotMatch(packageJson.scripts["build:site"], /media-desk|dist-media-desk/i);
});

test("Wrangler protects the custom domain before serving isolated static assets", async () => {
  const wrangler = await source("tools/cloudflare/media-desk/wrangler.jsonc");
  assert.match(wrangler, /media\.looksawful\.ru/);
  assert.match(wrangler, /"custom_domain"\s*:\s*true/);
  assert.match(wrangler, /"directory"\s*:\s*"\.\.\/\.\.\/\.\.\/dist-media-desk"/);
  assert.match(wrangler, /"binding"\s*:\s*"ASSETS"/);
  assert.match(wrangler, /"run_worker_first"\s*:\s*true/);
  assert.doesNotMatch(wrangler, /MEDIA_DESK_BRANCH[^\n]*(?:dev|prod)/);
});

test("Cloudflare PR verification never receives Media Desk runtime secrets", async () => {
  const workflow = await source(".github/workflows/media-desk-cloudflare.yml");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:[\s\S]*branches:\s*\[dev\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /npm run media-desk:build/);
  assert.match(workflow, /npm run media-desk:cf:dry-run/);

  const pullRequestSection = workflow.split(/\n\s*deploy:/, 1)[0];
  assert.doesNotMatch(pullRequestSection, /MEDIA_DESK_(?:GITHUB_TOKEN|PASSWORD_HASH|SESSION_SECRET)/);

  const deploySection = workflow.split(/\n\s*deploy:/u)[1] ?? "";
  assert.match(deploySection, /github\.ref\s*==\s*'refs\/heads\/dev'/);
  assert.match(deploySection, /github\.event_name\s*==\s*'workflow_dispatch'/);
  assert.match(deploySection, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.doesNotMatch(deploySection, /github\.event_name\s*!=\s*'pull_request'/);
});

test("isolated Desk build declares remote write provenance without enabling local server writes", async () => {
  const build = await source("tools/cloudflare/media-desk/build.mjs");
  const vite = await source("tools/cloudflare/media-desk/vite.config.mjs");
  const mode = await source("src/devtools/media-desk/mode-status.ts");
  const entry = await source("src/devtools/media-desk/editor-entry.ts");

  assert.match(build, /VITE_CONTENT_DESK_REMOTE[^\n]*1/);
  assert.match(build, /VITE_CONTENT_DESK_WRITE[^\n]*1/);
  assert.match(build, /VITE_CONTENT_DESK_BRANCH[^\n]*content\/text-cms/);
  assert.match(vite, /dist-media-desk/);
  assert.match(vite, /tools[\\/]media-desk[\\/]index\.html/);
  assert.match(mode, /REMOTE WRITE/);
  assert.match(mode, /VITE_CONTENT_DESK_REMOTE/);
  assert.match(entry, /auth-controls\.css/);
});

test("secret bootstrap provisions PBKDF2 password hash and never revives raw SHA-256 auth", async () => {
  const script = await source("tools/cloudflare/media-desk/configure-secrets.ps1");
  assert.match(script, /MEDIA_DESK_PASSWORD_HASH/);
  assert.match(script, /hash-password\.mjs/);
  assert.match(script, /MEDIA_DESK_SESSION_SECRET/);
  assert.match(script, /MEDIA_DESK_GITHUB_TOKEN/);
  assert.doesNotMatch(script, /MEDIA_DESK_PASSWORD_SHA256|Get-Sha256Hex/);
});
