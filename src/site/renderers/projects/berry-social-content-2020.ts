import { renderProjectArticle } from "../shared/entity-article.ts";

export function renderBerrySocialContentArticle(homepageTemplate: string): string {
  return renderProjectArticle(homepageTemplate, {
    articleId: "project-berry-social-content-2020",
    sourceMarker: "<!-- BERRY_INTRO -->",
  });
}
