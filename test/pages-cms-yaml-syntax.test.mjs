import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const TEXT_SCALAR_KEYS = new Set(["description", "label", "message", "title", "button"]);

function findAmbiguousTextScalars(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(/^\s+([A-Za-z][\w-]*):\s+(.+)$/);
    if (!match || !TEXT_SCALAR_KEYS.has(match[1])) return [];

    const value = match[2].trim();
    if (/^["'|>]/.test(value)) return [];
    if (!value.includes(": ")) return [];

    return [`${index + 1}: ${line.trim()}`];
  });
}

test("Pages CMS text values containing colon-space are quoted YAML scalars", async () => {
  const source = await readFile(cmsConfigUrl, "utf8");
  const offenders = findAmbiguousTextScalars(source);

  assert.deepEqual(
    offenders,
    [],
    `Quote textual Pages CMS values that contain ': ' so YAML cannot interpret them as nested mappings:\n${offenders.join("\n")}`,
  );
});
