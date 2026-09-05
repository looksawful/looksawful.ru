import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function repoFile(path) {
  return new URL(`../${path}`, import.meta.url);
}

test("runtime entrypoints are TypeScript-only", () => {
  const indexHtml = readFileSync(repoFile("index.html"), "utf8");
  const pageShell = readFileSync(repoFile("src/site/shell/page-shell.ts"), "utf8");

  assert.match(indexHtml, /\/src\/main\.ts/);
  assert.doesNotMatch(indexHtml, /\/src\/main\.js/);
  assert.match(pageShell, /\/src\/main\.ts/);
  assert.doesNotMatch(pageShell, /\/src\/main\.js/);

  assert.equal(existsSync(repoFile("src/main.js")), false);
  assert.equal(existsSync(repoFile("src/interactive.js")), false);
});
