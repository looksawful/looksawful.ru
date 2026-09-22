import type { LogoUsageId } from "../../data/logos/index.ts";
import type { EntityIntroData } from "../../types/content.ts";
import type { EntityPageId } from "./ids.ts";
import type { Section } from "./sections.ts";

export interface CasePortfolioIntroData {
  kind: "case";
  role: string;
  task: string;
  contribution: string;
  result: string;
}

export interface ProjectPortfolioIntroData {
  kind: "project";
  what: string;
  role: string;
  result: string;
}

export interface CollectionPortfolioIntroData {
  kind: "collection";
  role: string;
  period: string;
  contents: string;
}

export type EntityPortfolioIntroData =
  | CasePortfolioIntroData
  | ProjectPortfolioIntroData
  | CollectionPortfolioIntroData;

export interface EntityPageContent {
  pageId: EntityPageId;
  intro: EntityIntroData<LogoUsageId>;
  portfolioIntro?: EntityPortfolioIntroData;
  sections: readonly Section[];
}
