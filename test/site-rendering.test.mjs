import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderEntityIntro } from "../src/components/composition/index.ts";
import { jesteiIntro } from "../src/data/content/jestei-pool.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const legacyCanonicalEntityShells = /<article\b(?=[^>]*\bid=["']project-(?:jestei|styx|sensetique|shootings)["'])[^>]*>\s*<\/article>\s*/g;
const legacyHiddenProjectArticles = /<article\b(?=[^>]*\bclass=["'][^"']*\bproject\b[^"']*["'])(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/article>\s*/g;

function withoutLegacyProjectScaffolds(html) {
  return html
    .replace(legacyCanonicalEntityShells, "")
    .replace(legacyHiddenProjectArticles, "");
}

test("homepage canonical entities do not depend on legacy source article scaffolds", () => {
  const source = withoutLegacyProjectScaffolds(indexHtml);
  const html = renderHomepagePage(source);

  for (const articleId of [
    "project-jestei",
    "project-styx",
    "project-sensetique",
    "project-shootings",
  ]) {
    assert.equal(
      (html.match(new RegExp(`id=["']${articleId}["']`, "g")) ?? []).length,
      1,
      `${articleId} must be rendered exactly once from canonical PageContent`,
    );
  }

  assert.doesNotMatch(
    html,
    /<!-- (?:BERRY|SANDS|AWFUL_CASES|MOVES_AWFUL|MAD_COW_FILMS|LI_NE_AGENCY|PROGRESS_TRADITION|MOSCOW_NEWS)_[A-Z0-9_]+ -->/,
  );
});

test("homepage build removes retired hidden Project marker scaffolds", () => {
  const html = renderHomepagePage(indexHtml);

  assert.doesNotMatch(html, /<!-- [A-Z][A-Z0-9_]+ -->/);
  assert.doesNotMatch(html, /<article\b(?=[^>]*\bclass=["'][^"']*\bproject\b[^"']*["'])(?=[^>]*\bhidden\b)/);
});

test("entity intro keeps homepage h2 by default and supports standalone h1", () => {
  const homepage = renderEntityIntro(jesteiIntro);
  const standalone = renderEntityIntro(jesteiIntro, { headingLevel: 1 });

  assert.match(homepage, /<h2 class="project__title"/);
  assert.match(standalone, /<h1 class="project__title"/);
  assert.doesNotMatch(standalone, /<h2 class="project__title"/);
});
