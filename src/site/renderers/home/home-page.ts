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
import { renderSiteNavigation } from "../../shell/navigation.ts";
import { renderEntityShell } from "../entity/entity-shell.ts";
import { renderHomepage } from "./home-slots.ts";

const legacyHomepageNavigation = /<nav\b(?=[^>]*\bdata-site-navigation\b)(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/nav>/g;
const homepageProjectNavigation = /<nav\b(?=[^>]*\bdata-projects-navigation\b)[^>]*>[\s\S]*?<\/nav>/g;
const legacyCanonicalEntityShells = /<article\b(?=[^>]*\bid=["']project-(?:jestei|styx|sensetique|shootings)["'])[^>]*>\s*<\/article>\s*/g;
const legacyHiddenProjectArticles = /<article\b(?=[^>]*\bclass=["'][^"']*\bproject\b[^"']*["'])(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/article>\s*/g;

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

function renderCanonicalHomepageEntities(): string {
  return [...homepageEntries]
    .sort((left, right) => left.order - right.order)
    .map(renderCanonicalHomepageEntity)
    .join("\n");
}

function removeLegacyProjectScaffolds(html: string): string {
  return html
    .replace(legacyCanonicalEntityShells, "")
    .replace(legacyHiddenProjectArticles, "");
}

function insertCanonicalHomepageEntities(html: string): string {
  const matches = html.match(homepageProjectNavigation);

  if (matches?.length !== 1) {
    throw new Error(
      `Expected exactly one homepage project navigation, found ${matches?.length ?? 0}`,
    );
  }

  const navigation = matches[0];
  return html.replace(
    navigation,
    `${navigation}\n${renderCanonicalHomepageEntities()}`,
  );
}

export function renderHomepagePage(html: string): string {
  const source = removeLegacyProjectScaffolds(html);
  const rendered = insertCanonicalHomepageEntities(renderHomepage(source));
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
