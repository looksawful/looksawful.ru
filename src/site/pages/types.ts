import type { CaseId } from "../../data/catalog/cases.ts";
import type { CollectionId } from "../../data/catalog/collections.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";

export interface PageDiscovery {
  listed: boolean;
  indexable: boolean;
}

interface BasePageDefinition {
  id: string;
  path: string;
  enabled: boolean;
  discovery: PageDiscovery;
}

export interface HomePageDefinition extends BasePageDefinition {
  type: "home";
  id: "home";
}

export interface CasePageDefinition extends BasePageDefinition {
  type: "case";
  entityId: CaseId;
}

export interface ProjectPageDefinition extends BasePageDefinition {
  type: "project";
  entityId: ProjectId;
}

export interface CollectionPageDefinition extends BasePageDefinition {
  type: "collection";
  entityId: CollectionId;
}

export interface StaticPageDefinition extends BasePageDefinition {
  type: "static";
  pageKey: string;
}

export interface NotFoundPageDefinition extends BasePageDefinition {
  type: "not-found";
  id: "not-found";
  path: "/404.html";
}

export type EntityPageDefinition =
  | CasePageDefinition
  | ProjectPageDefinition
  | CollectionPageDefinition;

export type SitePageDefinition =
  | HomePageDefinition
  | EntityPageDefinition
  | StaticPageDefinition
  | NotFoundPageDefinition;
