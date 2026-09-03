import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/tools/media-desk/text-desk.ts", import.meta.url), "utf8");

test("text desk guards dirty detail before switching or mobile back", () => {
  assert.match(source, /export function canLeaveTextEditor/);
  assert.match(source, /currentDetail && !currentDetail\.canLeave\(\)/);
  assert.match(source, /if \(canLeaveTextEditor\(isDirty\(\)\)\) onBack\(\)/);
});

test("text desk keeps current detail when search or source filter changes", () => {
  assert.match(source, /search\.addEventListener\("input", render\)/);
  assert.match(source, /sourceFilter\.addEventListener\("change", render\)/);
  assert.doesNotMatch(source, /search\.addEventListener\("input", select/);
  assert.doesNotMatch(source, /sourceFilter\.addEventListener\("change", select/);
});

test("text desk Ctrl or Cmd S reuses the same save path", () => {
  assert.match(source, /const saveCurrent = async \(\): Promise<void> =>/);
  assert.match(source, /save\.addEventListener\("click", \(\) => \{\s*void saveCurrent\(\);/s);
  assert.match(source, /\(event\.ctrlKey \|\| event\.metaKey\).*event\.preventDefault\(\);\s*void saveCurrent\(\);/s);
});

test("successful text save resets dirty state and refreshes preview without reload", () => {
  assert.match(source, /entry\.value = textarea\.value;/);
  assert.match(source, /state = "saved";/);
  assert.match(source, /save\.disabled = true;/);
  assert.match(source, /onSaved\(\);/);
  assert.match(source, /content-desk:text-saved/);
  assert.doesNotMatch(source, /location\.reload\s*\(/);
});
