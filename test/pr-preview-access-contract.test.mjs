import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PR Preview refuses to publish while the shared Pages Access boundary is public", async () => {
  const workflow = await read(".github/workflows/pr-preview.yml");
  assert.match(workflow, /Require Cloudflare Access service credentials/);
  assert.match(workflow, /Verify shared preview Access before deploy/);
  assert.match(workflow, /lab\.looksawful-ru-preview\.pages\.dev\/lab\//);
  assert.ok(
    workflow.indexOf("Verify shared preview Access before deploy") < workflow.indexOf("Deploy exact artifact to Cloudflare Pages preview"),
    "privacy verification must happen before a new PR preview is published",
  );
});

test("PR Preview authenticates HTTP and browser QA with the exact CI service token", async () => {
  const workflow = await read(".github/workflows/pr-preview.yml");
  assert.match(workflow, /CF_ACCESS_CLIENT_ID/);
  assert.match(workflow, /CF_ACCESS_CLIENT_SECRET/);
  assert.match(workflow, /CF-Access-Client-Id/);
  assert.match(workflow, /CF-Access-Client-Secret/);
  assert.match(workflow, /wrapBrowserWithAccess/);
  assert.match(workflow, /Access-protected immutable deployment/);
  assert.doesNotMatch(workflow, /immutable public internet deployment/);
});

test("Access helper fails closed for anonymous preview content", async () => {
  const helper = await read("tools/preview/cloudflare-access.mjs");
  assert.match(helper, /Anonymous request still reaches preview content/);
  assert.match(helper, /\.cloudflareaccess\.com/);
  assert.match(helper, /CF-Access-Client-Id/);
  assert.match(helper, /CF-Access-Client-Secret/);
});
