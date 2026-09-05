import type { EntityPageContentRegistry } from "../../content/pages/registry.ts";
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
