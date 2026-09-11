import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  applyFrameDebugStyles,
  canAccessFrameDocument,
  createElementSelector,
  summarizeElement,
} from "../src/devtools/lab/frame-tools.ts";

const source = readFileSync(
  fileURLToPath(new URL("../src/devtools/lab/frame-tools.ts", import.meta.url)),
  "utf8",
);

test("Lab frame tools expose only focused DOM/debug helpers", () => {
  assert.equal(typeof canAccessFrameDocument, "function");
  assert.equal(typeof applyFrameDebugStyles, "function");
  assert.equal(typeof createElementSelector, "function");
  assert.equal(typeof summarizeElement, "function");
});

test("Lab frame tools contain no CMS, network, publication or destructive authority", () => {
  const forbidden = [
    "/__media-desk/",
    "fetch(",
    "XMLHttpRequest",
    "writeFile",
    "publish",
    "delete",
  ];

  for (const token of forbidden) {
    assert.equal(
      source.includes(token),
      false,
      `frame-tools.ts must not contain forbidden authority token: ${token}`,
    );
  }
});

test("Lab frame tools do not import Media Desk or CMS modules", () => {
  assert.equal(/from\s+["'][^"']*media-desk/i.test(source), false);
  assert.equal(/from\s+["'][^"']*cms/i.test(source), false);
});
