import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../index.html", import.meta.url);
const runtimePath = new URL("../src/components/berserk-audio-player.ts", import.meta.url);

test("Berserk audio seek uses a named native range contract", async () => {
  const [html, runtime] = await Promise.all([
    readFile(htmlPath, "utf8"),
    readFile(runtimePath, "utf8"),
  ]);

  assert.match(
    html,
    /<input(?=[^>]*\bdata-audio-progress)(?=[^>]*\btype="range")(?=[^>]*\baria-label="[^"]+")[^>]*>/,
  );
  assert.match(
    runtime,
    /querySelector<HTMLInputElement>\("\[data-audio-progress\]"\)/,
  );
  assert.match(runtime, /progress\?\.addEventListener\("input"/);
  assert.doesNotMatch(runtime, /progress\?\.addEventListener\("pointerdown"/);
});
