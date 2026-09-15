import type { EntityPageContent } from "../../content/contracts/page-content.ts";
import type { Section } from "../../content/contracts/sections.ts";
import {
  entityPageContentRegistry,
  getEntityPageContent,
} from "../../content/pages/index.ts";
import { renderEntityShell } from "../../site/renderers/entity/entity-shell.ts";
import { renderSection } from "../../site/renderers/entity/section.ts";
import { getEntityShellPresentation } from "../../site/pages/entity-presentation.ts";
import { sitePages } from "../../site/pages/manifest.ts";
import type { EntityPageDefinition } from "../../site/pages/types.ts";

export type StorybookViewport = "desktop" | "tablet" | "mobile";
export type StorybookKind = "template" | "composition" | "page";
export type StorybookVariant = "compact" | "standalone";

export interface StorybookRouteDiscovery {
  path: string;
  listed: boolean;
  indexable: boolean;
}

export interface StorybookFixture {
  id: string;
  label: string;
  kind: StorybookKind;
  variant: StorybookVariant;
  owner: string;
  viewports: readonly StorybookViewport[];
  route?: StorybookRouteDiscovery;
  render: () => string;
}

const VIEWPORTS = ["desktop", "tablet", "mobile"] as const satisfies readonly StorybookViewport[];

function entityPages(): readonly EntityPageDefinition[] {
  return sitePages.filter((page): page is EntityPageDefinition =>
    page.enabled && (page.type === "case" || page.type === "collection" || page.type === "project"),
  );
}

function routeDiscovery(page: EntityPageDefinition): StorybookRouteDiscovery {
  return {
    path: page.path,
    listed: page.discovery.listed,
    indexable: page.discovery.indexable,
  };
}

function contentFor(page: EntityPageDefinition): EntityPageContent {
  return getEntityPageContent(entityPageContentRegistry, page.id);
}

function renderCanonicalArticle(page: EntityPageDefinition): string {
  const content = contentFor(page);
  const presentation = getEntityShellPresentation(page.id);
  return renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 1,
  });
}

function firstRenderableSection(page: EntityPageDefinition): Section {
  const section = contentFor(page).sections.find((candidate) => candidate.type !== "specialized");
  if (!section) throw new Error(`Storybook fixture has no ordinary section: ${page.id}`);
  return section;
}

function pageLabel(page: EntityPageDefinition): string {
  return `${page.type} · ${page.entityId}`;
}

function templateFixtures(): StorybookFixture[] {
  return entityPages().map((page) => ({
    id: `template:${page.id}`,
    label: `${pageLabel(page)} · section owner`,
    kind: "template" as const,
    variant: "compact" as const,
    owner: "src/site/renderers/entity/section.ts → renderSection",
    viewports: VIEWPORTS,
    route: routeDiscovery(page),
    render: () => renderSection(firstRenderableSection(page)),
  }));
}

function compositionFixtures(): StorybookFixture[] {
  return entityPages().map((page) => ({
    id: `composition:${page.id}`,
    label: `${pageLabel(page)} · canonical article`,
    kind: "composition" as const,
    variant: "compact" as const,
    owner: "src/site/renderers/entity/entity-shell.ts → renderEntityShell",
    viewports: VIEWPORTS,
    route: routeDiscovery(page),
    render: () => renderCanonicalArticle(page),
  }));
}

function representativePageFixtures(): StorybookFixture[] {
  const representativeTypes = new Set(["case", "collection", "project"]);
  const seen = new Set<string>();
  const representatives = entityPages().filter((page) => {
    if (!representativeTypes.has(page.type) || seen.has(page.type)) return false;
    seen.add(page.type);
    return true;
  });

  return representatives.map((page) => ({
    id: `page:${page.id}`,
    label: `${pageLabel(page)} · standalone archetype`,
    kind: "page" as const,
    variant: "standalone" as const,
    owner: "src/site/pages/manifest.ts + canonical entity renderers",
    viewports: VIEWPORTS,
    route: routeDiscovery(page),
    render: () => renderCanonicalArticle(page),
  }));
}

export const storybookInventory = [
  ...templateFixtures(),
  ...compositionFixtures(),
  ...representativePageFixtures(),
] as const satisfies readonly StorybookFixture[];

export const storybookInventoryEvidence = {
  source: "production",
  pageManifest: "src/site/pages/manifest.ts",
  pageContent: "src/content/pages/index.ts",
  sectionOwner: "src/site/renderers/entity/section.ts",
  compositionOwner: "src/site/renderers/entity/entity-shell.ts",
  presentationOwner: "src/site/pages/entity-presentation.ts",
  fixtureCount: storybookInventory.length,
  routeCount: entityPages().length,
} as const;
