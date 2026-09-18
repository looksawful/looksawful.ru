import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { USEFUL_PROJECT_DEFINITIONS } from "../src/data/content/useful-projects.ts";

const cmsConfig = readFileSync(new URL("../.pages.yml", import.meta.url), "utf8");

function cmsBlock(name) {
  return cmsConfig.match(new RegExp(`\\n  - name: ${name}\\b[\\s\\S]*?(?=\\n  - name: [a-z0-9-]+\\b)`))?.[0] ?? "";
}

test("useful project visibility and state are CMS-owned rather than code-owned", () => {
  for (const definition of USEFUL_PROJECT_DEFINITIONS) {
    assert.equal("visible" in definition, false, `${definition.id}.visible must come from CMS content`);
    assert.equal("state" in definition, false, `${definition.id}.state must come from CMS content`);
  }
});

test("Pages CMS exposes useful project copy and state as separate safe surfaces", () => {
  const copyBlock = cmsBlock("useful-project-cards");
  assert.match(copyBlock, /path: src\/content\/editorial\/useful-project-cards\.json/);
  assert.doesNotMatch(copyBlock, /\b(href|route|coverEntryId|visible|state)\b/);

  const stateBlock = cmsBlock("useful-project-state");
  assert.match(stateBlock, /path: src\/content\/useful-projects\.json/);
  assert.match(stateBlock, /- name: id[\s\S]*?readonly: true/);
  assert.match(stateBlock, /- name: visible[\s\S]*?type: boolean/);
  assert.match(stateBlock, /- name: state[\s\S]*?type: select/);
  assert.doesNotMatch(stateBlock, /\b(href|route)\b/);
});

test("video-compatible cover assignment remains on the Media Desk CMS mapping", () => {
  const overrides = readFileSync(new URL("../src/content/subproject-card-covers.json", import.meta.url), "utf8");
  assert.doesNotThrow(() => JSON.parse(overrides));
  assert.doesNotMatch(cmsBlock("useful-project-state"), /type: image/);
});
