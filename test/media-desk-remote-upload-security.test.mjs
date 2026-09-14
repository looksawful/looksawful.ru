import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/devtools/media-desk/inventory-remote-upload.ts", import.meta.url),
  "utf8",
);

test("video metadata probing never assigns DOM-selected file data to video.src", () => {
  assert.doesNotMatch(source, /video\.src\s*=/u);
  assert.match(source, /video\.srcObject\s*=\s*file/u);
});
