import { awfulStudioIntro } from "../../../data/content/awful-studio.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const awfulStudioPageContent = {
  pageId: "project:awful-studio",
  intro: awfulStudioIntro,
  sections: [],
} as const satisfies EntityPageContent;
