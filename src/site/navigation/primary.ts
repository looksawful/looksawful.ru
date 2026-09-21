import type { SitePageId } from "../pages/types.ts";

export const PRIMARY_NAVIGATION_PAGE_IDS = [
  "work",
  "gallery",
  "cv",
] as const satisfies readonly SitePageId[];

export const NAVIGATION_LABEL_PAGE_IDS = [
  "home",
  ...PRIMARY_NAVIGATION_PAGE_IDS,
] as const satisfies readonly SitePageId[];

export type PrimaryNavigationPageId = (typeof PRIMARY_NAVIGATION_PAGE_IDS)[number];
export type NavigationLabelPageId = (typeof NAVIGATION_LABEL_PAGE_IDS)[number];
