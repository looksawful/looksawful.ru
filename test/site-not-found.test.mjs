import assert from "node:assert/strict";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderNotFoundPage } from "../src/site/renderers/not-found-page.ts";

const notFound = sitePages.find((page) => page.type === "not-found");
if (!notFound) throw new Error("missing not-found page definition");

test("404 is a static noindex document with a direct route home", () => {
  const html = renderNotFoundPage(notFound);

  assert.match(html, /<h1>404<\/h1>/);
  assert.match(html, /href="\/"/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(html, /http-equiv=["']refresh["']/i);
  assert.doesNotMatch(html, /location\.(?:href|replace|assign)/);
});
