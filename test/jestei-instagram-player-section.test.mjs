import assert from "node:assert/strict";
import test from "node:test";

import { jesteiPoolPageContent } from "../src/content/pages/cases/jestei-pool.ts";
import { jesteiInstagramPlayerStrip } from "../src/data/content/jestei-pool.ts";

test("Jestei Instagram player copy belongs to the section, not hover captions", () => {
  const section = jesteiPoolPageContent.sections.find(
    (candidate) => candidate.id === "jestei-instagram-player",
  );

  assert.ok(section, "Instagram player section must exist");
  assert.equal(
    jesteiInstagramPlayerStrip.captionView,
    "lightbox-only",
    "player media must not expose repeated overlay captions",
  );
  assert.deepEqual(section.intro, {
    title: "Промокоммуникация Jestei Pool",
    paragraphs: ["Интерактивный плеер для Instagram-постов."],
  });
});
