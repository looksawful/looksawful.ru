import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const consentUrl = new URL("../src/components/site-analytics-consent.ts", import.meta.url);

test("dynamic analytics consent uses only the production country resolver", async () => {
  const source = await readFile(consentUrl, "utf8");
  assert.doesNotMatch(source, /\/cdn-cgi\/trace/);
  assert.match(source, /https:\/\/api\.country\.is\//);
});
