import { renderJesteiTrackFilter } from "../../../components/specialized/index.ts";
import {
  entityPageContentRegistry,
  getEntityPageContent,
} from "../../../content/pages/index.ts";
import { resolveEntityPageContentVisibility } from "../../../data/content/section-visibility.ts";
import { getEntityShellPresentation } from "../../pages/entity-presentation.ts";
import {
  homepageEntries,
  type HomepageEntry,
} from "../../pages/homepage.ts";
import { getPageByPath } from "../../pages/manifest.ts";
import { homeSearchPresentation } from "../../pages/search-presentation.ts";
import type { EntityPageId } from "../../pages/types.ts";
import { replaceRequiredSlot } from "../../rendering/html.ts";
import {
  renderHomeStructuredData,
  replacePageMetadata,
} from "../../shell/metadata.ts";
import { renderSiteNavigation } from "../../shell/navigation.ts";
import { renderEntityShell } from "../entity/entity-shell.ts";
import { renderHomepage } from "./home-slots.ts";

const homeEntitiesMount = '<div data-home-entities></div>';
const legacyHomepageNavigation = /<nav\b(?=[^>]*\bdata-site-navigation\b)(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/nav>/g;
const homeStructuredData = /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/i;

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
  const content = resolveEntityPageContentVisibility(
    getEntityPageContent(entityPageContentRegistry, pageId),
  );
  const presentation = getEntityShellPresentation(pageId);

  return renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 2,
    specialized: {
      jesteiTrackFilter: renderJesteiTrackFilter,
    },
  });
}

function renderCanonicalHomepageEntities(): string {
  return [...homepageEntries]
    .sort((left, right) => left.order - right.order)
    .map(renderCanonicalHomepageEntity)
    .join("\n");
}

function replaceHomepageStructuredData(html: string): string {
  const structuredData = renderHomeStructuredData();
  if (homeStructuredData.test(html)) {
    return html.replace(homeStructuredData, structuredData);
  }

  if (!/<\/head>/i.test(html)) {
    throw new Error("Homepage is missing </head> for structured data");
  }

  return html.replace(/<\/head>/i, `${structuredData}\n</head>`);
}

function excludeUtilityTextFromSnippets(html: string): string {
  let output = html.replace(
    /<address class="cluster">([\s\S]*?)<\/address>/i,
    '<!--noindex--><address class="cluster" data-nosnippet>$1</address><!--/noindex-->',
  );

  output = output.replace(
    /<footer class="project__footer cluster" data-reveal-group>([\s\S]*?)<\/footer>/gi,
    '<!--noindex--><footer class="project__footer cluster" data-reveal-group data-nosnippet>$1</footer><!--/noindex-->',
  );

  return output;
}

export function renderHomepagePage(html: string): string {
  const page = getHomePage();
  const rendered = replaceRequiredSlot(
    renderHomepage(html),
    homeEntitiesMount,
    renderCanonicalHomepageEntities(),
  );
  const matches = rendered.match(legacyHomepageNavigation);

  if (matches?.length !== 1) {
    throw new Error(
      `Expected exactly one legacy homepage navigation, found ${matches?.length ?? 0}`,
    );
  }

  const withNavigation = rendered.replace(
    legacyHomepageNavigation,
    renderSiteNavigation(page),
  );
  const withMetadata = replacePageMetadata(withNavigation, {
    page,
    ...homeSearchPresentation,
  });
  const withStructuredData = replaceHomepageStructuredData(withMetadata);

  return excludeUtilityTextFromSnippets(withStructuredData);
}
