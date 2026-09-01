import { getCase, getCollection, getProject } from "../../data/catalog/lookup.ts";
import {
  getNavigationLabel,
  navigationLabels,
  type NavigationLabelData,
} from "../../data/navigation.ts";
import { sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition, SitePageId } from "../pages/types.ts";
import {
  PRIMARY_NAVIGATION_PAGE_IDS,
  type PrimaryNavigationPageId,
} from "./primary.ts";

export interface SiteNavigationItem {
  id: SitePageId;
  label: string;
  href: string;
}

export interface SiteBreadcrumbItem {
  id: SitePageId;
  label: string;
  href?: string;
  current?: boolean;
}

function getDomainPageLabel(page: SitePageDefinition): string {
  switch (page.type) {
    case "home":
      return getNavigationLabel("home");
    case "case":
      return getCase(page.entityId).name || page.entityId;
    case "collection": {
      const collection = getCollection(page.entityId);
      return collection.displayName || collection.name || page.entityId;
    }
    case "project":
      return getProject(page.entityId).name || page.entityId;
    case "not-found":
      return "404";
    case "static":
      return page.id;
  }
}

function getNavigationPageLabel(
  page: SitePageDefinition,
  labels: readonly NavigationLabelData[],
): string {
  return labels.find((item) => item.id === page.id)?.label ?? getDomainPageLabel(page);
}

function requirePage(
  id: PrimaryNavigationPageId,
  pages: readonly SitePageDefinition[],
): SitePageDefinition {
  const page = pages.find((candidate) => candidate.id === id && candidate.enabled);

  if (!page) {
    throw new Error(`Primary navigation page is unavailable: ${id}`);
  }

  return page;
}

export function getPrimaryNavigationItems(
  labels: readonly NavigationLabelData[] = navigationLabels,
  pages: readonly SitePageDefinition[] = sitePages,
): readonly SiteNavigationItem[] {
  return PRIMARY_NAVIGATION_PAGE_IDS.map((id) => {
    const page = requirePage(id, pages);
    return {
      id: page.id,
      label: getNavigationPageLabel(page, labels),
      href: page.path,
    };
  });
}

export function getBreadcrumbItems(
  page: SitePageDefinition,
  labels: readonly NavigationLabelData[] = navigationLabels,
  pages: readonly SitePageDefinition[] = sitePages,
): readonly SiteBreadcrumbItem[] {
  if (page.type === "home") return [];

  const homePage = requirePage("home", pages);

  return [
    {
      id: homePage.id,
      label: getNavigationLabel("home", labels),
      href: homePage.path,
    },
    {
      id: page.id,
      label: getNavigationPageLabel(page, labels),
      current: true,
    },
  ];
}
