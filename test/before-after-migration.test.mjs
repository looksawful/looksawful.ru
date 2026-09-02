import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { jesteiSubscriptionBeforeAfter } from "../src/data/content/jestei-pool.ts";

const templateUrl = new URL("../src/templates/before-after.ts", import.meta.url);

test("before-after authored content is typed production data", () => {
  assert.equal(jesteiSubscriptionBeforeAfter.before.entryId, "jestei-06-source-01-16x9-use-01");
  assert.equal(jesteiSubscriptionBeforeAfter.after.entryId, "jestei-06-source-02-16x9-use-01");
  assert.equal(typeof jesteiSubscriptionBeforeAfter.caption.title, "string");
});

test("before-after renderer preserves runtime selectors and controls", async () => {
  const { renderBeforeAfter } = await import(templateUrl);
  const html = renderBeforeAfter(jesteiSubscriptionBeforeAfter);

  assert.match(html, /class="before-after" data-before-after="" data-caption-view="summary"/);
  assert.match(html, /class="before-after__image before-after__base"/);
  assert.match(html, /class="before-after__reveal"/);
  assert.match(html, /class="before-after__range"/);
  assert.match(html, /draggable="false"/);
  assert.match(html, /value="50"/);
});

test("index and site composition render before-after through one slot", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const composition = await readFile(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );
  const marker = "<!-- JESTEI_SUBSCRIPTION_BEFORE_AFTER -->";

  assert.equal(index.split(marker).length - 1, 1);
  assert.equal(composition.split(marker).length - 1, 1);
  assert.match(composition, /renderBeforeAfter/);
});
