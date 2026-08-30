import { getCase, getCollection, getProject } from "../../data/catalog/lookup.ts";
import {
  getNavigationLabel,
  navigationLabels,
  type NavigationLabelData,
} from "../../data/navigation.ts";
import { sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition } from "../pages/types.ts";

export interface SiteNavigationItem {
  id: string;
  label: string;
  href: string;
}

export interface SiteBreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
}

const primaryPageIds = [
  "home",
  "case:jestei-pool",
  "case:styx",
  "case:sensetique",
  "collection:music-photography",
] as const;

function getDomainPageLabel(page: SitePageDefinition): string {
  switch (page.type) {
    case "home":
      return getNavigationLabel("home");
    case "case":
      return getCase(page.entityId).name;
    case "collection": {
      const collection = getCollection(page.entityId);
      return collection.displayName ?? collection.name;
    }
    case "project":
      return getProject(page.entityId).name;
    case "not-found":
      return "404";
    case "static":
      return page.pageKey;
  }
}

function getNavigationPageLabel(
  page: SitePageDefinition,
  labels: readonly NavigationLabelData[],
): string {
  return labels.find((item) => item.id === page.id)?.label ?? getDomainPageLabel(page);
}

function requirePage(id: (typeof primaryPageIds)[number]): SitePageDefinition {
  const page = sitePages.find((candidate) => candidate.id === id && candidate.enabled);

  if (!page) {
    throw new Error(`Primary navigation page is unavailable: ${id}`);
  }

  return page;
}

export function getPrimaryNavigationItems(
  labels: readonly NavigationLabelData[] = navigationLabels,
): readonly SiteNavigationItem[] {
  const pageItems = primaryPageIds.map((id) => {
    const page = requirePage(id);
    return {
      id: page.id,
      label: getNavigationPageLabel(page, labels),
      href: page.path,
    };
  });

  return [
    ...pageItems,
    {
      id: "cv",
      label: getNavigationLabel("cv", labels),
      href: "/cv/",
    },
  ];
}

export function getBreadcrumbItems(
  page: SitePageDefinition,
  labels: readonly NavigationLabelData[] = navigationLabels,
): readonly SiteBreadcrumbItem[] {
  if (page.type === "home") return [];

  return [
    {
      id: "home",
      label: getNavigationLabel("home", labels),
      href: "/",
    },
    {
      id: page.id,
      label: getNavigationPageLabel(page, labels),
      current: true,
    },
  ];
}
