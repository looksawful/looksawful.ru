import { renderJesteiTrackFilter } from "../../../components/specialized/index.ts";
import {
  entityPageContentRegistry,
  getEntityPageContent,
} from "../../../content/pages/index.ts";
import { getEntityShellPresentation } from "../../pages/entity-presentation.ts";
import {
  homepageEntries,
  type HomepageEntry,
} from "../../pages/homepage.ts";
import { getPageByPath } from "../../pages/manifest.ts";
import type { EntityPageId } from "../../pages/types.ts";
import { extractElementById } from "../../rendering/html.ts";
import { renderSiteNavigation } from "../../shell/navigation.ts";
import { renderEntityShell } from "../entity/entity-shell.ts";
import { renderHomepage } from "./home-slots.ts";

const legacyHomepageNavigation = /<nav\b(?=[^>]*\bdata-site-navigation\b)(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/nav>/g;

function getHomePage() {
  const page = getPageByPath("/");

  if (!page || page.type !== "home") {
    throw new Error("Homepage route is unavailable");
  }

  return page;
}

function pageIdForHomepageEntry(entry: HomepageEntry): EntityPageId {
  return `${entry.entity.type}:${entry.entity.id}` as EntityPageId;
}

function renderCanonicalHomepageEntity(entry: HomepageEntry): string {
  const pageId = pageIdForHomepageEntry(entry);
  const content = getEntityPageContent(entityPageContentRegistry, pageId);
  const presentation = getEntityShellPresentation(pageId);

  return renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 2,
    specialized: {
      jesteiTrackFilter: renderJesteiTrackFilter,
    },
  });
}

function replaceHomepageEntities(html: string): string {
  const entries = [...homepageEntries].sort((left, right) => left.order - right.order);

  return entries.reduce((output, entry) => {
    const pageId = pageIdForHomepageEntry(entry);
    const presentation = getEntityShellPresentation(pageId);
    const legacyArticle = extractElementById(output, "article", presentation.articleId);
    const canonicalArticle = renderCanonicalHomepageEntity(entry);

    return output.replace(legacyArticle, canonicalArticle);
  }, html);
}

export function renderHomepagePage(html: string): string {
  const rendered = replaceHomepageEntities(renderHomepage(html));
  const matches = rendered.match(legacyHomepageNavigation);

  if (matches?.length !== 1) {
    throw new Error(
      `Expected exactly one legacy homepage navigation, found ${matches?.length ?? 0}`,
    );
  }

  return rendered.replace(
    legacyHomepageNavigation,
    renderSiteNavigation(getHomePage()),
  );
}
