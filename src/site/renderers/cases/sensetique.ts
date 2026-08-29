import { renderLargeEntityArticle } from "../shared/entity-article.ts";

export function renderSensetiqueArticle(homepageTemplate: string): string {
  return renderLargeEntityArticle(homepageTemplate, {
    articleId: "project-sensetique",
    introMarker: "SENSETIQUE_INTRO",
  });
}
