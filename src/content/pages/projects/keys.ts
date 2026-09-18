import {
  keysArchitectureIntro,
  keysIntro,
} from "../../../data/content/keys.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

export const keysPageContent = {
  pageId: "project:keys",
  intro: keysIntro,
  sections: [
    {
      type: "project",
      id: "keys-browser-runtime",
      projectId: "keys",
      intro: keysArchitectureIntro,
      blocks: [
        {
          type: "code-block",
          data: {
            title: "Проверка и запуск",
            language: "shell",
            code: "npm run check\nnpm start",
          },
        },
      ],
    },
  ],
} as const satisfies EntityPageContent;
