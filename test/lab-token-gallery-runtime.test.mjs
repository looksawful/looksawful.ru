import assert from "node:assert/strict";
import test from "node:test";

import { groupTokensByKind } from "../src/lab/token-visualization.mjs";

test("groups tokens by kind with stable insertion order", () => {
  const groups = groupTokensByKind([
    { name: "--a", kind: "color" },
    { name: "--b", kind: "spacing" },
    { name: "--c", kind: "color" },
  ]);
  assert.deepEqual([...groups.keys()], ["color", "spacing"]);
  assert.deepEqual(groups.get("color").map((token) => token.name), ["--a", "--c"]);
});