import { renderProjectArticle } from "../shared/entity-article.ts";

export function renderMovesAwfulArticle(homepageTemplate: string): string {
  return renderProjectArticle(homepageTemplate, {
    articleId: "project-moves-awful",
    sourceMarker: "<!-- MOVES_AWFUL_INTRO -->",
  });
}
