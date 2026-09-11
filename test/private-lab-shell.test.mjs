import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private Lab is an isolated non-production build", async () => {
  const [labConfig, publicConfig, labHtml] = await Promise.all([
    read("vite.lab.config.ts"),
    read("vite.config.ts"),
    read("lab/index.html"),
  ]);

  assert.match(labConfig, /lab\/index\.html/);
  assert.match(labConfig, /127\.0\.0\.1/);
  assert.doesNotMatch(labConfig, /media-desk\/server/);
  assert.doesNotMatch(publicConfig, /lab\/index\.html/);
  assert.match(labHtml, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(labHtml, /data-environment="non-production"/);
  assert.match(labHtml, /data-mode="read-only"/);
});

test("integration Lab does not invent a parallel authentication mechanism", async () => {
  const labHtml = await read("lab/index.html");
  const source = await read("src/lab/index.ts");

  assert.doesNotMatch(labHtml, /LAB_PASSWORD|basic auth|WWW-Authenticate/i);
  assert.doesNotMatch(source, /LAB_PASSWORD|Authorization|github oauth/i);
});

test("Lab client stays read-only and carries exact build provenance fields", async () => {
  const source = await read("src/lab/index.ts");

  assert.match(source, /__LAB_BRANCH__/);
  assert.match(source, /__LAB_COMMIT__/);
  assert.match(source, /__LAB_BUILD_TIME__/);
  assert.match(source, /READ ONLY/);
  assert.doesNotMatch(source, /CONTENT_DESK_WRITE/);
  assert.doesNotMatch(source, /__media-desk\/api/);
  assert.doesNotMatch(source, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/);
});
