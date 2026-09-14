import assert from "node:assert/strict";
import test from "node:test";

import {
  LOOKSAWFUL_STORY_LAYER_VALUES,
  LOOKSAWFUL_STORY_POLICY_VALUES,
  LOOKSAWFUL_VISIBILITY_VALUES,
  validateLooksawfulStoryParameters,
} from "../tools/lab/storybook/state-schema.mjs";

const valid = () => ({
  sources: ["src/components/site-navigation.ts", "src/site/shell/navigation.ts"],
  layer: "organism",
  policy: "behavior-fixture",
  canonical: true,
  state: "menu-open",
  visibility: ["disclosure", "input-capability"],
  interaction: ["open", "focus-visible"],
  data: ["ready"],
  motion: ["motion-enabled", "reduced-motion"],
  responsive: {
    review: ["desktop", "tablet", "mobile"],
    conditions: ["(hover: hover) and (pointer: fine)"],
  },
  routeDiscovery: { listed: true, indexable: true },
});

test("accepts canonical Storybook metadata with independent state axes", () => {
  assert.equal(validateLooksawfulStoryParameters(valid()), true);
  assert.ok(LOOKSAWFUL_STORY_LAYER_VALUES.includes("page"));
  assert.ok(LOOKSAWFUL_STORY_POLICY_VALUES.includes("behavior-fixture"));
  assert.ok(LOOKSAWFUL_VISIBILITY_VALUES.includes("overlay"));
});

test("rejects unknown schema keys and enum values", () => {
  assert.throws(() => validateLooksawfulStoryParameters({ ...valid(), layer: "widget" }), /layer/i);
  assert.throws(() => validateLooksawfulStoryParameters({ ...valid(), policy: "snapshot" }), /policy/i);
  assert.throws(() => validateLooksawfulStoryParameters({ ...valid(), mystery: true }), /unknown.*mystery/i);
});

test("keeps route discovery separate from visual visibility", () => {
  assert.throws(
    () => validateLooksawfulStoryParameters({ ...valid(), visibility: ["route-discovery"] }),
    /visibility/i,
  );
  assert.throws(
    () => validateLooksawfulStoryParameters({ ...valid(), routeDiscovery: { listed: "no", indexable: false } }),
    /routeDiscovery\.listed/i,
  );
});

test("validates sources, state slugs and responsive evidence", () => {
  assert.throws(() => validateLooksawfulStoryParameters({ ...valid(), sources: [] }), /sources/i);
  assert.throws(
    () => validateLooksawfulStoryParameters({ ...valid(), sources: ["src/a.ts", "src/a.ts"] }),
    /duplicate/i,
  );
  assert.throws(() => validateLooksawfulStoryParameters({ ...valid(), state: "Menu Open" }), /state/i);
  assert.throws(
    () => validateLooksawfulStoryParameters({ ...valid(), responsive: { review: ["watch"] } }),
    /responsive\.review/i,
  );
});
