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
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "intro", field: "lead", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Lead copy" },
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "interface", field: "sections[0].title", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Product" },
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "interface", field: "sections[0].paragraphs[0]", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Same copy" },
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "interface", field: "sections[0].paragraphs[1]", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Same copy" },
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "design-system", field: "overlays[0].text", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Overlay copy" },
    { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", section: "credit-1", field: "credits[0].title", source: "src/content/i18n/en/cases/jestei-pool.json", text: "Credit copy" },
  ]);
});

test("extractCaseDocument covers intro lead, credit lines and notes without generic recursion", () => {
  const records = extractCaseDocument({
    page: "case:sensetique",
    route: "/work/sensetique/",
    locale: "ru",
    source: "src/content/cases/sensetique.json",
    data: {
      intro: { lead: "Nested lead", debugLabel: "ignore me" },
      credits: [{ id: "shoot", lines: ["Photographer A", "Producer B"] }],
      notes: [{ id: "shoot", text: "Editorial note" }],
      metadata: { description: "ignore metadata" },
    },
  });

  assert.deepEqual(
    records.map(({ section, field, text }) => ({ section, field, text })),
    [
      { section: "intro", field: "intro.lead", text: "Nested lead" },
      { section: "shoot", field: "credits[0].lines[0]", text: "Photographer A" },
      { section: "shoot", field: "credits[0].lines[1]", text: "Producer B" },
      { section: "shoot", field: "notes[0].text", text: "Editorial note" },
    ],
  );
});

test("resolveConfiguredCaseSources derives routes from the canonical site manifest", () => {
  const sources = resolveConfiguredCaseSources();
  assert.deepEqual(
    sources.filter((entry) => entry.page === "case:jestei-pool"),
    [
      { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "ru", source: "src/content/cases/jestei-pool.json" },
      { page: "case:jestei-pool", route: "/work/jestei-pool/", locale: "en", source: "src/content/i18n/en/cases/jestei-pool.json" },
    ],
  );
  assert.equal(sources.some((entry) => entry.source.includes("media-catalog")), false);
});
