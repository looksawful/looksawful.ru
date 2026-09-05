import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/devtools/media-desk/text-desk.ts", import.meta.url), "utf8");

test("text desk guards dirty detail before switching and uses one guarded close lifecycle", () => {
  assert.match(source, /export function canLeaveTextEditor/);
  assert.match(source, /currentDetail && !currentDetail\.canLeave\(\)/);
  assert.match(source, /const closeDetail = \(\): void => \{/);
  assert.match(source, /if \(currentDetail && !currentDetail\.canLeave\(\)\) return;\s*selected = null;\s*currentDetail = null;/s);
  assert.match(source, /back\.addEventListener\("click", onBack\)/);
  assert.doesNotMatch(source, /if \(canLeaveTextEditor\(isDirty\(\)\)\) onBack\(\)/);
});

test("discarded mobile detail is destroyed and can be selected again", () => {
  assert.match(source, /selected = null;/);
  assert.match(source, /currentDetail = null;/);
  assert.match(source, /detail\.replaceChildren\(emptyDetail\(\)\);/);
  assert.match(source, /root\.classList\.remove\("text-desk--detail-open"\);\s*render\(\);/s);
  assert.match(source, /if \(selected === entry\) return;/);
  assert.match(source, /currentDetail = detailPane\(entry, closeDetail, render\)/);
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
