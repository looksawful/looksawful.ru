import assert from "node:assert/strict";
import test from "node:test";

import { rewriteCvDevRequest } from "../src/site/build/site-pages-plugin.ts";

test("Vite dev rewrites the clean CV route to the public index document", () => {
  assert.equal(rewriteCvDevRequest("/cv/"), "/cv/index.html");
  assert.equal(rewriteCvDevRequest("/cv"), "/cv/index.html");
  assert.equal(rewriteCvDevRequest("/cv/?preview=1"), "/cv/index.html?preview=1");
  assert.equal(rewriteCvDevRequest("/cv/index.html"), "/cv/index.html");
  assert.equal(rewriteCvDevRequest("/work/styx/"), "/work/styx/");
});
