import type { SitePageDefinition } from "./types.ts";
import { normalizePagePath, validateSitePages } from "./validation.ts";

const VITE_BUILD = { kind: "vite" } as const;

export const sitePages = [
  {
    id: "home",
    type: "home",
    path: "/",
    enabled: true,
    renderer: "home",
    build: VITE_BUILD,
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "case:jestei-pool",
    type: "case",
    entityId: "jestei-pool",
    path: "/work/jestei-pool/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "case:styx",
    type: "case",
    entityId: "styx",
    path: "/work/styx/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "case:sensetique",
    type: "case",
    entityId: "sensetique",
    path: "/work/sensetique/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "collection:music-photography",
    type: "collection",
    entityId: "music-photography",
    path: "/shootings/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "project:awful-cases",
    type: "project",
    entityId: "awful-cases",
    path: "/work/awful-cases/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: false,
      indexable: false,
    },
  },
  {
    id: "project:moves-awful",
    type: "project",
    entityId: "moves-awful",
    path: "/work/moves-awful/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: false,
      indexable: false,
    },
  },
  {
    id: "project:berry-social-content-2020",
    type: "project",
    entityId: "berry-social-content-2020",
    path: "/work/berry-social-content-2020/",
    enabled: true,
    renderer: "entity",
    build: VITE_BUILD,
    discovery: {
      listed: false,
      indexable: false,
    },
  },
  {
    id: "cv",
    type: "static",
    path: "/cv/",
    enabled: true,
    renderer: "cv",
    build: {
      kind: "public-static",
      sourcePath: "public/cv/index.html",
    },
    discovery: {
      listed: true,
      indexable: true,
    },
  },
  {
    id: "not-found",
    type: "not-found",
    path: "/404.html",
    enabled: true,
    renderer: "not-found",
    build: VITE_BUILD,
    discovery: {
      listed: false,
      indexable: false,
    },
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
