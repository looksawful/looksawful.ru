import assert from "node:assert/strict";
import test from "node:test";

import { renderEntityPortfolioIntro } from "../src/components/composition/entity-portfolio-intro.ts";
import { validateEntityPageContent } from "../src/content/pages/validation.ts";

test("Case portfolio intro renders the approved explicit labels and escapes authored values", () => {
  const html = renderEntityPortfolioIntro({
    kind: "case",
    role: "Art & Design Director",
    task: "Unify <product> & brand",
    contribution: "Led product, brand & team",
    result: "Launched the unified system",
  });

  for (const label of ["Role", "Task", "Contribution", "Result"]) {
    assert.match(html, new RegExp(`<dt[^>]*>${label}<\\/dt>`));
  }
  assert.match(html, /Unify &lt;product&gt; &amp; brand/);
  assert.doesNotMatch(html, /<product>/);
});

test("Project and Collection portfolio intros keep type-specific contracts", () => {
  const project = renderEntityPortfolioIntro({
    kind: "project",
    what: "Interactive identity experiment",
    role: "Designer / developer",
    result: "Published prototype",
  });
  assert.match(project, />What<\/dt>/);
  assert.match(project, />Role<\/dt>/);
  assert.match(project, />Result<\/dt>/);
  assert.doesNotMatch(project, />Task<\/dt>/);

  const collection = renderEntityPortfolioIntro({
    kind: "collection",
    role: "Photographer",
    period: "2019–2025",
    contents: "Selected music photography",
  });
  assert.match(collection, />Role<\/dt>/);
  assert.match(collection, />Period<\/dt>/);
  assert.match(collection, />Contents<\/dt>/);
});

test("PageContent rejects a portfolio intro whose kind disagrees with the canonical entity type", () => {
  assert.throws(
    () => validateEntityPageContent({
      pageId: "case:jestei-pool",
      intro: {
        title: { type: "text", text: "Jestei Pool" },
      },
      portfolioIntro: {
        kind: "project",
        what: "Wrong contract",
        role: "Designer",
        result: "Wrong kind",
      },
      sections: [],
    }),
    /portfolio intro kind/i,
  );
});
