import type { SitePageId } from "../pages/types.ts";

export const PRIMARY_NAVIGATION_PAGE_IDS = [
  "home",
  "case:jestei-pool",
  "case:styx",
  "case:sensetique",
  "collection:music-photography",
  "cv",
] as const satisfies readonly SitePageId[];

export type PrimaryNavigationPageId = (typeof PRIMARY_NAVIGATION_PAGE_IDS)[number];
