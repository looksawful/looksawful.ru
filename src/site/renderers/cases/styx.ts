import { renderLargeEntityArticle } from "../shared/entity-article.ts";

export function renderStyxArticle(homepageTemplate: string): string {
  return renderLargeEntityArticle(homepageTemplate, {
    articleId: "project-styx",
    introMarker: "STYX_INTRO",
  });
}
