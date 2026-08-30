import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("blog browser smoke waits for observable filter and search URL state", async () => {
  const source = await readFile(new URL("../tools/smoke-blog.mjs", import.meta.url), "utf8");

  assert.match(source, /page\.waitForURL\(/, "blog smoke must wait for History API URL state instead of sampling page.url() immediately");
  assert.match(source, /searchParams\.get\(["']type["']\)\s*===\s*["']tool["']/, "blog smoke must wait for the selected type parameter");
  assert.match(source, /searchParams\.get\(["']q["']\)\s*===\s*["']css["']/, "blog smoke must wait for the search parameter");
  assert.doesNotMatch(source, /assert\(new URL\(page\.url\(\)\)\.searchParams\.get\(/, "blog smoke must not use immediate page.url() snapshots for History API assertions");
});
