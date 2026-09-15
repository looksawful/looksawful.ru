import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventory = await readFile(
  new URL("../src/devtools/media-desk/inventory-readonly.ts", import.meta.url),
  "utf8",
);
const uploadUi = await readFile(
  new URL("../src/devtools/media-desk/inventory-remote-upload.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("remote inventory mounts one global upload panel only in remote mode", () => {
  assert.match(inventory, /createRemoteUploadPanel/);
  assert.match(inventory, /VITE_CONTENT_DESK_REMOTE/);
  assert.match(uploadUi, /uploadNewMedia/);
});
test("remote upload panel exposes explicit gallery metadata and technical probing", () => {
  assert.match(uploadUi, /Добавить медиа/);
  assert.match(uploadUi, /Показывать в галерее/);
  assert.match(uploadUi, /title/i);
  assert.match(uploadUi, /alt/i);
  assert.match(uploadUi, /probeMediaFile/);
  assert.match(uploadUi, /durationSeconds/);
  assert.match(uploadUi, /showInCatalog/);
  assert.match(uploadUi, /16 MiB/);
});
