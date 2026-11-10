import { shadersIntro } from "../../../data/content/shaders.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const shadersPageContent = {
  pageId: "project:shaders",
  intro: shadersIntro,
  sections: [],
} as const satisfies EntityPageContent;
