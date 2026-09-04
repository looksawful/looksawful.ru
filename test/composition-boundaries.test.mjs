import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("shared composition exposes canonical entity/card/teaser boundaries", () => {
  const contentTypes = readFileSync("src/types/content.ts", "utf8");
  const entityIntro = readFileSync("src/components/composition/entity-intro.ts", "utf8");
  const portfolioCard = readFileSync("src/components/composition/portfolio-entity-card.ts", "utf8");
  const projectTeaser = readFileSync("src/components/composition/project-teaser.ts", "utf8");

  assert.match(contentTypes, /export interface EntityIntroData/);
  assert.match(contentTypes, /Use EntityIntroData/);
  assert.match(entityIntro, /renderProjectIntro as renderEntityIntro/);
  assert.match(portfolioCard, /renderProjectCard as renderPortfolioEntityCard/);
  assert.match(projectTeaser, /projectId: ProjectId/);
  assert.match(projectTeaser, /coverEntryId: MediaEntryId/);
  assert.doesNotMatch(projectTeaser, /\btitle:/);
  assert.doesNotMatch(projectTeaser, /\bdescription:/);
  assert.doesNotMatch(projectTeaser, /\brole:/);
});
