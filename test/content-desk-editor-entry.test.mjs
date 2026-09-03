import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const indexHtml = await readFile(new URL("../tools/media-desk/index.html", import.meta.url), "utf8");
const entrySource = await readFile(new URL("../src/tools/media-desk/editor-entry.ts", import.meta.url), "utf8");

test("Content Desk uses one ordered module entry and skips legacy editor bootstrap in Text view", () => {
  assert.equal((indexHtml.match(/<script type="module"/g) ?? []).length, 1);
  assert.match(indexHtml, /editor-entry\.ts/);
  assert.doesNotMatch(indexHtml, /src="\/src\/tools\/media-desk\/editor\.ts"/);
  assert.match(entrySource, /^import "\.\/main\.ts";/m);
  assert.match(entrySource, /get\("view"\) === "text"/);
  assert.match(entrySource, /if \(!isTextView\)/);
  assert.match(entrySource, /import\("\.\/editor\.ts"\)/);
});
