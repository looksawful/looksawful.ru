import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventory = await readFile(new URL("../src/devtools/media-desk/inventory-readonly.ts", import.meta.url), "utf8");
const controls = await readFile(new URL("../src/devtools/media-desk/inventory-remote-controls.ts", import.meta.url), "utf8").catch(() => "");

test("remote inventory controls are isolated from ordinary read-only inventory", () => {
  assert.match(inventory, /createInventoryRemoteControls/);
  assert.match(inventory, /VITE_CONTENT_DESK_REMOTE/);
  assert.match(controls, /RemoteMediaDeskSession/);
  assert.match(controls, /replaceInventoryRecord/);
  assert.match(controls, /deleteInventoryRecord/);
  assert.match(controls, /remoteControlState/);
});

test("remote inventory controls expose guarded replace and delete actions with inline status", () => {
  assert.match(controls, /Заменить/);
  assert.match(controls, /Удалить/);
  assert.match(controls, /role.*status|setAttribute\("role",\s*"status"\)/s);
  assert.match(controls, /deleteReason/);
  assert.match(controls, /409|RemoteMediaDeskError/);
});

test("remote inventory controls expose typed project and pet cover assignment", () => {
  assert.match(controls, /assignProjectCoverFromInventory/);
  assert.match(controls, /assignPetCoverFromInventory/);
  assert.match(controls, /projectCardPresentations/);
  assert.match(controls, /petProjectCards/);
  assert.match(controls, /Обложка проекта/);
  assert.match(controls, /Обложка pet/);
  assert.match(controls, /record\.usage\.entryIds/);
});
