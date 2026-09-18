import { seaIntro } from "../../../data/content/sea.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const seaPageContent = {
  pageId: "project:sea",
  intro: seaIntro,
  sections: [],
} as const satisfies EntityPageContent;
