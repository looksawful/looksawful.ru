import { renderLargeEntityArticle } from "../shared/entity-article.ts";

export function renderShootingsArticle(homepageTemplate: string): string {
  return renderLargeEntityArticle(homepageTemplate, {
    articleId: "project-shootings",
    introMarker: "SHOOTINGS_INTRO",
  });
}
