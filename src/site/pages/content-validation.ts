import type { EntityPageContentRegistry } from "../../content/pages/registry.ts";
import type { EntityShellPresentationRegistry } from "./entity-presentation.ts";
import type { EntityPageDefinition, SitePageDefinition } from "./types.ts";

function isEntityPage(page: SitePageDefinition): page is EntityPageDefinition {
  return page.type === "case" || page.type === "project" || page.type === "collection";
}

export interface PageContentCoverageOptions {
  requireEnabledEntityCoverage?: boolean;
}

export function validatePageContentManifest(
  pages: readonly SitePageDefinition[],
  registry: EntityPageContentRegistry,
  options: PageContentCoverageOptions = {},
): void {
  const manifestIds = new Set(
    pages.filter(isEntityPage).map((page) => page.id),
  );

  for (const pageId of registry.keys()) {
    if (!manifestIds.has(pageId)) {
      throw new Error(`PageContent is not declared in page manifest: ${pageId}`);
    }
  }

  if (!options.requireEnabledEntityCoverage) {
    return;
  }

  for (const page of pages) {
    if (!isEntityPage(page) || !page.enabled) {
      continue;
    }

    if (!registry.has(page.id)) {
      throw new Error(`Enabled entity page has no PageContent: ${page.id}`);
    }
  }
}

export function validateEntityPageArchitecture(
  pages: readonly SitePageDefinition[],
  contentRegistry: EntityPageContentRegistry,
  presentationRegistry: EntityShellPresentationRegistry,
): void {
  validatePageContentManifest(pages, contentRegistry, {
    requireEnabledEntityCoverage: true,
  });

  const entityPages = pages.filter(isEntityPage);
  const manifestIds = new Set(entityPages.map((page) => page.id));

  for (const pageId of presentationRegistry.keys()) {
    if (!manifestIds.has(pageId)) {
      throw new Error(`Entity presentation is not declared in page manifest: ${pageId}`);
    }
  }

  for (const page of entityPages) {
    if (!page.enabled) {
      continue;
    }

    if (!presentationRegistry.has(page.id)) {
      throw new Error(`Enabled entity page has no presentation: ${page.id}`);
    }
  }
}
