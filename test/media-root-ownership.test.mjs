import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const toolingFiles = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/media-dev-state.mjs",
  "tools/sync-media-catalog.mjs",
  "tools/check-data-integrity.ts",
];

test("repository has no legacy root media tree", async () => {
  let error = null;
  try {
    await access(new URL("../media/", import.meta.url));
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, "root media/ must stay absent; public/media is canonical delivery storage");
  assert.equal(error.code, "ENOENT");
});

test("media tooling resolves URL-backed assets from public storage only", async () => {
  for (const filename of toolingFiles) {
    const source = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /path\.join\(repoRoot,\s*clean\)/, `${filename} must not resolve through repoRoot/media`);
    assert.match(source, /path\.join\(repoRoot,\s*"public",\s*clean\)/, `${filename} must resolve through public storage`);
  }

  const integrity = await readFile(new URL("../tools/check-data-integrity.ts", import.meta.url), "utf8");
  assert.doesNotMatch(integrity, /walkFiles\(path\.join\(repoRoot,\s*"media"\)\)/, "physical integrity scan must not treat legacy root media as delivery storage");
});
