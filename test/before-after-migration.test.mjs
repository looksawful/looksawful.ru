import assert from "node:assert/strict";
import test from "node:test";

import { renderBeforeAfter } from "../src/components/content/index.ts";
import { jesteiSubscriptionBeforeAfter } from "../src/data/content/jestei-pool.ts";

test("before-after authored content is typed production data", () => {
  assert.equal(jesteiSubscriptionBeforeAfter.before.entryId, "jestei-06-source-01-16x9-use-01");
  assert.equal(jesteiSubscriptionBeforeAfter.after.entryId, "jestei-06-source-02-16x9-use-01");
  assert.equal(typeof jesteiSubscriptionBeforeAfter.caption.title, "string");
});

test("before-after renderer preserves runtime selectors and controls", () => {
  const html = renderBeforeAfter(jesteiSubscriptionBeforeAfter);

  assert.match(html, /class="before-after" data-before-after="" data-caption-view="summary"/);
  assert.match(html, /class="before-after__image before-after__base"/);
  assert.match(html, /class="before-after__reveal"/);
  assert.match(html, /class="before-after__range"/);
  assert.match(html, /draggable="false"/);
  assert.match(html, /value="50"/);
});