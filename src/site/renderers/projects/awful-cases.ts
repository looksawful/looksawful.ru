import { renderProjectArticle } from "../shared/entity-article.ts";

export function renderAwfulCasesArticle(homepageTemplate: string): string {
  return renderProjectArticle(homepageTemplate, {
    articleId: "project-awful-cases",
    sourceMarker: "<!-- AWFUL_CASES_INTRO -->",
  });
}
