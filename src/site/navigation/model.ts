import { getCase, getCollection, getProject } from "../../data/catalog/lookup.ts";
import { projectIndexMediaAssetFor } from "../../data/media/assets/project-index.ts";
import { responsiveVariantsFor } from "../../data/media/responsive.ts";
import {
  getNavigationLabel,
  navigationLabels,
  type NavigationLabelData,
} from "../../data/navigation.ts";
import { projectCardPresentations } from "../../data/projects.ts";
import { sitePages } from "../pages/manifest.ts";
import type { SitePageDefinition, SitePageId } from "../pages/types.ts";
import {
  PRIMARY_NAVIGATION_PAGE_IDS,
  type PrimaryNavigationPageId,
} from "./primary.ts";

const NAVIGATION_PREVIEW_OVERRIDES = {
  home: "/media/hero/hero-portrait.webp",
  cv: "/media/cv/portrait-signature.webp",
} as const satisfies Partial<Record<PrimaryNavigationPageId, string>>;

export interface SiteNavigationItem {
  id: PrimaryNavigationPageId;
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

function resolveProjectNavigationPreview(id: PrimaryNavigationPageId): string | undefined {
  const card = projectCardPresentations.find((candidate) => candidate.pageId === id);
  if (!card) return undefined;

  const asset = projectIndexMediaAssetFor(card);
  const preview = responsiveVariantsFor(asset).find((variant) => variant.width === 768);
  return preview?.src ?? card.cover.src;
}

function getNavigationPreviewSrc(id: PrimaryNavigationPageId): string {
  const override = NAVIGATION_PREVIEW_OVERRIDES[id as keyof typeof NAVIGATION_PREVIEW_OVERRIDES];
  if (override) return override;

  const projectPreview = resolveProjectNavigationPreview(id);
  if (projectPreview) return projectPreview;

  throw new Error(`Primary navigation preview is unavailable: ${id}`);
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
