import {
  extractElementById,
  extractElementContainingMarker,
  replaceRequiredSlots,
} from "../../rendering/html.ts";
import {
  createHomepageSlots,
  renderHomepage,
  type HomepageIntroMarker,
} from "../home/home-slots.ts";

export interface LargeEntityArticleContract {
  articleId: string;
  introMarker: HomepageIntroMarker;
}

export interface ProjectArticleContract {
  articleId: string;
  sourceMarker: string;
}

export function renderLargeEntityArticle(
  homepageTemplate: string,
  contract: LargeEntityArticleContract,
): string {
  const renderedHomepage = renderHomepage(homepageTemplate, {
    headingLevel1For: contract.introMarker,
  });
  return extractElementById(renderedHomepage, "article", contract.articleId);
}

export function renderProjectArticle(
  homepageTemplate: string,
  contract: ProjectArticleContract,
): string {
  const sourceArticle = extractElementContainingMarker(
    homepageTemplate,
    "article",
    contract.sourceMarker,
  );
  const relevantSlots = createHomepageSlots().filter(([marker]) => sourceArticle.includes(marker));
  let article = replaceRequiredSlots(sourceArticle, relevantSlots);

  article = article.replace(
    /^<article\b([^>]*)>/,
    (_opening, attributes: string) => {
      const visibleAttributes = attributes.replace(/\s+hidden(?=\s|$)/, "");
      return `<article id="${contract.articleId}"${visibleAttributes}>`;
    },
  );
  article = article.replace(
    /<h2(\s+class="project__title"[^>]*)>([\s\S]*?)<\/h2>/,
    "<h1$1>$2</h1>",
  );

  return article;
}
