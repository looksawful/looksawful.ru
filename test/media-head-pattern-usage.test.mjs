import assert from "node:assert/strict";
import test from "node:test";

import { sensetiqueInnaHonourReel } from "../src/data/content/sensetique.ts";
import { renderMediaGroup } from "../src/templates/media-group.ts";

test("single-credit media-group heads use prose instead of a fake split", () => {
  const html = renderMediaGroup(sensetiqueInnaHonourReel);

  assert.match(html, /class="media-group__head prose"/);
  assert.doesNotMatch(html, /class="media-group__head[^"]*\bsplit(?:-always)?\b/);
  assert.match(html, /class="credits"/);
});
