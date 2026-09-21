import type { EntityPageId as CanonicalEntityPageId } from "../../content/contracts/ids.ts";
import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";

export interface PageDiscovery {
  listed: boolean;
  indexable: boolean;
}

export type EntityPageId = CanonicalEntityPageId;

export type StaticPageId = "cv" | "privacy";
export type SitePageId = "home" | "work" | "gallery" | StaticPageId | "not-found" | EntityPageId;

export interface VitePageBuild {
  kind: "vite";
}

export interface PublicStaticPageBuild {
  kind: "public-static";
  sourcePath: string;
}

export type SitePageBuild = VitePageBuild | PublicStaticPageBuild;
export type SitePageRenderer = "home" | "work" | "gallery" | "entity" | "static-project" | "cv" | "privacy" | "not-found";

interface BasePageDefinition {
  id: SitePageId;
  path: string;
  enabled: boolean;
  discovery: PageDiscovery;
  renderer: SitePageRenderer;
  build: SitePageBuild;
}

export interface HomePageDefinition extends BasePageDefinition {
  type: "home";
  id: "home";
  renderer: "home";
  build: VitePageBuild;
}

export interface WorkPageDefinition extends BasePageDefinition {
  type: "work";
  id: "work";
  renderer: "work";
  build: VitePageBuild;
}

export interface GalleryPageDefinition extends BasePageDefinition {
  type: "gallery";
  id: "gallery";
  renderer: "gallery";
  build: VitePageBuild;
}

export interface CasePageDefinition extends BasePageDefinition {
  type: "case";
  id: `case:${CaseId}`;
  entityId: CaseId;
  renderer: "entity";
  build: VitePageBuild;
}

export interface EntityProjectPageDefinition extends BasePageDefinition {
  type: "project";
  id: `project:${ProjectId}`;
  entityId: ProjectId;
  renderer: "entity";
  build: VitePageBuild;
}

export interface StaticProjectPageDefinition extends BasePageDefinition {
  type: "project";
  id: `project:${ProjectId}`;
  entityId: ProjectId;
  renderer: "static-project";
  build: PublicStaticPageBuild;
}

export type ProjectPageDefinition =
  | EntityProjectPageDefinition
  | StaticProjectPageDefinition;

export interface CollectionPageDefinition extends BasePageDefinition {
  type: "collection";
  id: `collection:${CollectionId}`;
  entityId: CollectionId;
  renderer: "entity";
  build: VitePageBuild;
}

export interface CvPageDefinition extends BasePageDefinition {
  type: "static";
  id: "cv";
  renderer: "cv";
  build: PublicStaticPageBuild;
}

export interface PrivacyPageDefinition extends BasePageDefinition {
  type: "static";
  id: "privacy";
  renderer: "privacy";
  build: PublicStaticPageBuild;
}

export type StaticPageDefinition = CvPageDefinition | PrivacyPageDefinition;

export interface NotFoundPageDefinition extends BasePageDefinition {
  type: "not-found";
  id: "not-found";
  path: "/404.html";
  renderer: "not-found";
  build: VitePageBuild;
}

export type EntityPageDefinition =
  | CasePageDefinition
  | EntityProjectPageDefinition
  | CollectionPageDefinition;

export type SitePageDefinition =
  | HomePageDefinition
  | WorkPageDefinition
  | GalleryPageDefinition
  | CasePageDefinition
  | ProjectPageDefinition
  | CollectionPageDefinition
  | StaticPageDefinition
  | NotFoundPageDefinition;
