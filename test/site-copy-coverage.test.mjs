import assert from "node:assert/strict";
import test from "node:test";

import {
  findUnindexedVisibleCopy,
  normalizeVisibleCopy,
} from "../tools/editorial/site-copy-coverage.mjs";

test("visible-copy normalization collapses layout whitespace without changing words", () => {
  assert.equal(
    normalizeVisibleCopy("  Jestei\n\tPool   for DJs  "),
    "Jestei Pool for DJs",
  );
});

test("rendered coverage compares copy inside the same route and locale", () => {
  const indexed = [
    { route: "/work/jestei-pool/", locale: "en", text: "Jestei Pool for DJs" },
    { route: "/work/styx/", locale: "en", text: "STYX" },
  ];
  const rendered = [
    { route: "/work/jestei-pool/", locale: "en", locator: "main h1", text: "Jestei\nPool for DJs" },
    { route: "/work/jestei-pool/", locale: "en", locator: "main p", text: "Unindexed sentence" },
    { route: "/work/jestei-pool/", locale: "ru", locator: "main h1", text: "Jestei Pool for DJs" },
  ];

  assert.deepEqual(findUnindexedVisibleCopy({ indexed, rendered }), [
    {
      route: "/work/jestei-pool/",
      locale: "en",
      locator: "main p",
      text: "Unindexed sentence",
    },
    {
      route: "/work/jestei-pool/",
      locale: "ru",
      locator: "main h1",
      text: "Jestei Pool for DJs",
    },
  ]);
});

test("duplicate copy at different rendered locations remains independently reportable", () => {
  const indexed = [];
  const rendered = [
    { route: "/", locale: "ru", locator: "main h2:nth-of-type(1)", text: "Проекты" },
    { route: "/", locale: "ru", locator: "footer a", text: "Проекты" },
  ];

  assert.equal(findUnindexedVisibleCopy({ indexed, rendered }).length, 2);
});
