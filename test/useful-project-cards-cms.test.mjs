import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { USEFUL_PROJECT_DEFINITIONS } from "../src/data/content/useful-projects.ts";


test("useful project visibility and state are CMS-owned rather than code-owned", () => {
  for (const definition of USEFUL_PROJECT_DEFINITIONS) {
    assert.equal("visible" in definition, false, `${definition.id}.visible must come from CMS content`);
    assert.equal("state" in definition, false, `${definition.id}.state must come from CMS content`);
  }
});
