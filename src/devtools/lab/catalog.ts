import { sitePages } from "../../site/pages/manifest.ts";

export type LabPageVisibility = "live" | "hidden";

export interface LabPageCatalogEntry {
  id: string;
  path: string;
  type: string;
  listed: boolean;
  indexable: boolean;
  labVisible: true;
  visibility: LabPageVisibility;
}

export const LAB_PAGE_CATALOG: readonly LabPageCatalogEntry[] = sitePages.map((page) => ({
  id: page.id,
  path: page.path,
  type: page.type,
  listed: page.discovery.listed,
  indexable: page.discovery.indexable,
  labVisible: true,
  visibility:
    page.discovery.listed && page.discovery.indexable ? "live" : "hidden",
}));
