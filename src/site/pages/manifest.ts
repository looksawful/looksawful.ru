import type { SitePageDefinition } from "./types.ts";
import { normalizePagePath, validateSitePages } from "./validation.ts";

export const sitePages = [
  {
    id: "home",
    type: "home",
    path: "/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "case:jestei-pool",
    type: "case",
    entityId: "jestei-pool",
    path: "/work/jestei-pool/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "case:styx",
    type: "case",
    entityId: "styx",
    path: "/work/styx/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "case:sensetique",
    type: "case",
    entityId: "sensetique",
    path: "/work/sensetique/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "collection:music-photography",
    type: "collection",
    entityId: "music-photography",
    path: "/shootings/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "blog",
    type: "blog-index",
    path: "/blog/",
    enabled: true,
    discovery: { listed: true, indexable: true },
  },
  {
    id: "project:awful-cases",
    type: "project",
    entityId: "awful-cases",
    path: "/work/awful-cases/",
    enabled: true,
    discovery: { listed: false, indexable: false },
  },
  {
    id: "project:moves-awful",
    type: "project",
    entityId: "moves-awful",
    path: "/work/moves-awful/",
    enabled: true,
    discovery: { listed: false, indexable: false },
  },
  {
    id: "project:berry-social-content-2020",
    type: "project",
    entityId: "berry-social-content-2020",
    path: "/work/berry-social-content-2020/",
    enabled: true,
    discovery: { listed: false, indexable: false },
  },
  {
    id: "not-found",
    type: "not-found",
    path: "/404.html",
    enabled: true,
    discovery: { listed: false, indexable: false },
  },
] as const satisfies readonly SitePageDefinition[];

validateSitePages(sitePages);

export function getEnabledSitePages(): readonly SitePageDefinition[] {
  return sitePages.filter((page) => page.enabled);
}

export function getPageByPath(path: string): SitePageDefinition | undefined {
  const normalized = normalizePagePath(path);
  return sitePages.find((page) => page.enabled && page.path === normalized);
}
