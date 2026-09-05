import type { LogoUsageId } from "../../data/logos/index.ts";
import type { EntityIntroData } from "../../types/content.ts";
import type { EntityPageId } from "./ids.ts";
import type { Section } from "./sections.ts";

export interface EntityPageContent {
  pageId: EntityPageId;
  intro: EntityIntroData<LogoUsageId>;
  sections: readonly Section[];
}
