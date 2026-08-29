import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { createSiteInputs, pagePathToEntryPath } from "../src/site/build/inputs.ts";

const root = "/repo";

test("page routes map to physical Vite HTML entry paths", () => {
  assert.equal(pagePathToEntryPath("/"), "index.html");
  assert.equal(pagePathToEntryPath("/work/jestei-pool/"), "work/jestei-pool/index.html");
  assert.equal(pagePathToEntryPath("/shootings/"), "shootings/index.html");
  assert.equal(pagePathToEntryPath("/404.html"), "404.html");
});

test("Vite inputs are derived from enabled managed pages and exclude public CV ownership", () => {
  const inputs = createSiteInputs(root);
  const relative = Object.values(inputs).map((value) => path.relative(root, value).split(path.sep).join("/"));

  assert.deepEqual(new Set(relative), new Set([
    "index.html",
    "work/jestei-pool/index.html",
    "work/styx/index.html",
    "work/sensetique/index.html",
    "shootings/index.html",
    "404.html",
  ]));
  assert.equal(relative.includes("cv/index.html"), false);
});
