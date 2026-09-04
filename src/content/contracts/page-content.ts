import type { ProjectIntroData } from "../../types/content.ts";
import type { EntityPageId } from "./ids.ts";
import type { Section } from "./sections.ts";

export interface EntityPageContent {
  pageId: EntityPageId;
  intro: ProjectIntroData;
  sections: readonly Section[];
}
