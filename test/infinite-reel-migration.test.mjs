import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const mainUrl = new URL("../src/main.js", import.meta.url);
const typescriptUrl = new URL("../src/components/infinite-reel.ts", import.meta.url);
const legacyJavascriptUrl = new URL("../src/components/infinite-reel.js", import.meta.url);

test("infinite reel runtime uses the TypeScript implementation without a legacy JS duplicate", async () => {
  const [main, typescript] = await Promise.all([
    readFile(mainUrl, "utf8"),
    readFile(typescriptUrl, "utf8"),
  ]);

  assert.match(main, /from "\.\/components\/infinite-reel\.ts"/);
  assert.doesNotMatch(main, /infinite-reel\.js/);
  assert.match(typescript, /export function createInfiniteReels/);
  await assert.rejects(access(legacyJavascriptUrl));
});
