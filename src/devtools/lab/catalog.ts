import { sitePages } from "../../site/pages/manifest.ts";
import type { SitePageDefinition } from "../../site/pages/types.ts";
import { deriveLabPageLifecycle, type LabLifecycle } from "./types.ts";

export interface LabPageCatalogEntry {
  id: string;
  path: string;
  type: string;
  listed: boolean;
  indexable: boolean;
  labVisible: true;
  visibility: LabLifecycle;
}

function toLabPageCatalogEntry(page: SitePageDefinition): LabPageCatalogEntry {
  return {
    id: page.id,
    path: page.path,
    type: page.type,
    listed: page.discovery.listed,
    indexable: page.discovery.indexable,
    labVisible: true,
    visibility: deriveLabPageLifecycle({
      listed: page.discovery.listed,
      indexable: page.discovery.indexable,
      developmentStatus: page.development?.status,
    }),
  };
}

export const LAB_PAGE_CATALOG: readonly LabPageCatalogEntry[] = sitePages.map(
  (page) => toLabPageCatalogEntry(page),
);
