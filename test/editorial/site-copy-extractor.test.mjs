import assert from "node:assert/strict";
import test from "node:test";

import {
  extractCaseDocument,
  resolveConfiguredCaseSources,
} from "../../tools/editorial/site-copy-extractor.mjs";

test("extractCaseDocument emits only auditable copy with stable source locations", () => {
  const records = extractCaseDocument({
    page: "case:jestei-pool",
    route: "/work/jestei-pool/",
    locale: "en",
    source: "src/content/i18n/en/cases/jestei-pool.json",
    data: {
      lead: "Lead copy",
      media: { src: "/ignored.jpg", alt: "ignored technical fixture" },
      sections: [
        {
          id: "interface",
          title: "Product",
          paragraphs: ["Same copy", "Same copy"],
          video: { src: "/ignored.mp4" },
        },
      ],
      overlays: [{ id: "design-system", text: "Overlay copy" }],
      credits: [{ id: "credit-1", title: "Credit copy" }],
    },
  });

  assert.deepEqual(records, [
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "intro",
      field: "lead",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Lead copy",
    },
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "interface",
      field: "sections[0].title",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Product",
    },
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "interface",
      field: "sections[0].paragraphs[0]",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Same copy",
    },
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "interface",
      field: "sections[0].paragraphs[1]",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Same copy",
    },
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "design-system",
      field: "overlays[0].text",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Overlay copy",
    },
    {
      page: "case:jestei-pool",
      route: "/work/jestei-pool/",
      locale: "en",
      section: "credit-1",
      field: "credits[0].title",
      source: "src/content/i18n/en/cases/jestei-pool.json",
      text: "Credit copy",
    },
  ]);
});

test("resolveConfiguredCaseSources derives routes from the canonical site manifest", () => {
  const sources = resolveConfiguredCaseSources();

  assert.deepEqual(
    sources.filter((entry) => entry.page === "case:jestei-pool"),
    [
      {
        page: "case:jestei-pool",
        route: "/work/jestei-pool/",
        locale: "ru",
        source: "src/content/cases/jestei-pool.json",
      },
      {
        page: "case:jestei-pool",
        route: "/work/jestei-pool/",
        locale: "en",
        source: "src/content/i18n/en/cases/jestei-pool.json",
      },
    ],
  );

  assert.equal(
    sources.some((entry) => entry.source.includes("media-catalog")),
    false,
  );
});
