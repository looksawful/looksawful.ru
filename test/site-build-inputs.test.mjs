import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createSiteInputs, pagePathToEntryPath } from "../src/site/build/inputs.ts";
import { createSitePagesPlugin } from "../src/site/build/site-pages-plugin.ts";

const root = fileURLToPath(new URL("../", import.meta.url));

test("page routes map to physical Vite HTML entry paths", () => {
  assert.equal(pagePathToEntryPath("/"), "index.html");
  assert.equal(pagePathToEntryPath("/work/jestei-pool/"), "work/jestei-pool/index.html");
  assert.equal(pagePathToEntryPath("/work/awful-cases/"), "work/awful-cases/index.html");
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
    "work/awful-cases/index.html",
    "work/moves-awful/index.html",
    "work/berry-social-content-2020/index.html",
    "404.html",
  ]));
  assert.equal(relative.includes("cv/index.html"), false);

  for (const input of Object.values(inputs)) {
    assert.equal(existsSync(input), true, `missing physical Vite input ${input}`);
  }
});

test("site page HTML composition runs before Vite core asset processing", () => {
  const plugin = createSitePagesPlugin(root);
  assert.equal(typeof plugin.transformIndexHtml, "object");
  assert.equal(plugin.transformIndexHtml?.order, "pre");
  assert.equal(typeof plugin.transformIndexHtml?.handler, "function");
});
