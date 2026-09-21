import { getCase, getCollection, getProject } from "../../data/catalog/lookup.ts";
import { projectIndexMediaAssetFor } from "../../data/media/assets/project-index.ts";
import { responsiveVariantsFor } from "../../data/media/responsive.ts";
import {
  getNavigationLabel,
  navigationLabels,
  type NavigationLabelData,
} from "../../data/navigation.ts";
import { projectCardPresentations } from "../../data/projects.ts";
import { portfolioPresentation } from "../pages/portfolio-presentation.ts";
import { sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition, SitePageId } from "../pages/types.ts";
import {
  PRIMARY_NAVIGATION_PAGE_IDS,
  type PrimaryNavigationPageId,
} from "./primary.ts";

const NAVIGATION_PREVIEW_OVERRIDES = {
  work: "/media/projects/index/jestei-pool-cover.webp",
  gallery: "/media/projects/shootings/01/source/01-32x45.webp",
  cv: "/media/cv/portrait-signature.webp",
} as const satisfies Partial<Record<PrimaryNavigationPageId, string>>;

export interface SiteNavigationItem {
  id: SitePageId;
  label: string;
  href: string;
  previewSrc: string;
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
    case "work":
      return getNavigationLabel("work");
    case "gallery":
      return getNavigationLabel("gallery");
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
      return page.id === "cv" ? getNavigationLabel("cv") : page.id;
  }
}

function getNavigationPageLabel(
  page: SitePageDefinition,
  labels: readonly NavigationLabelData[],
): string {
  return labels.find((item) => item.id === page.id)?.label ?? getDomainPageLabel(page);
}

function requirePage(
  id: SitePageId,
  pages: readonly SitePageDefinition[],
): SitePageDefinition {
  const page = pages.find((candidate) => candidate.id === id && candidate.enabled);

  if (!page) {
    throw new Error(`Navigation page is unavailable: ${id}`);
  }

  return page;
}

function resolveProjectNavigationPreview(id: SitePageId): string | undefined {
  const card = projectCardPresentations.find((candidate) => candidate.pageId === id);
  if (!card) return undefined;

  const asset = projectIndexMediaAssetFor(card);
  const preview = responsiveVariantsFor(asset).find((variant) => variant.width === 768);
  return preview?.src ?? card.cover.src;
}

function getNavigationPreviewSrc(id: PrimaryNavigationPageId): string {
  const override = NAVIGATION_PREVIEW_OVERRIDES[id];
  if (override) return override;

  const projectPreview = resolveProjectNavigationPreview(id);
  if (projectPreview) return projectPreview;

  throw new Error(`Primary navigation preview is unavailable: ${id}`);
}

function getWorkNavigationPreviewSrc(id: SitePageId): string {
  const projectPreview = resolveProjectNavigationPreview(id);
  if (projectPreview) return projectPreview;
  throw new Error(`Work navigation preview is unavailable: ${id}`);
}

export function getPrimaryNavigationItems(
  labels: readonly NavigationLabelData[] = navigationLabels,
  pages: readonly SitePageDefinition[] = sitePages,
): readonly SiteNavigationItem[] {
  return PRIMARY_NAVIGATION_PAGE_IDS.map((id) => {
    const page = requirePage(id, pages);
    return {
      id,
      label: getNavigationPageLabel(page, labels),
      href: page.path,
      previewSrc: getNavigationPreviewSrc(id),
    };
  });
}

export function getWorkNavigationItems(
  labels: readonly NavigationLabelData[] = navigationLabels,
  pages: readonly SitePageDefinition[] = sitePages,
): readonly SiteNavigationItem[] {
  return portfolioPresentation.workShortcuts.map((id) => {
    const page = requirePage(id, pages);
    return {
      id,
      label: getNavigationPageLabel(page, labels),
      href: page.path,
      previewSrc: getWorkNavigationPreviewSrc(id),
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
