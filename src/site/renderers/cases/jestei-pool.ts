import { renderLargeEntityArticle } from "../shared/entity-article.ts";

export function renderJesteiPoolArticle(homepageTemplate: string): string {
  return renderLargeEntityArticle(homepageTemplate, {
    articleId: "project-jestei",
    introMarker: "JESTEI_INTRO",
  });
}
