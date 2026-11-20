import type { MediaGroupData } from "../../types/media-group.ts";
import type { ResourceLinksData, SectionNoteData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import { jesteiPromoSequence } from "./jestei-pool.ts";

export const jesteiEditorialResources = {
  text: "Правила коммуникации, терминологии и интерфейсных текстов.",
  links: [
    {
      label: "Почитать",
      href: "/docs/jestei-pool-redpolitika.html",
      rel: "noopener noreferrer",
      target: "_blank",
    },
    {
      label: "Скачать",
      href: "/docs/jestei-editorial-guide.pdf",
      download: "jestei-editorial-guide.pdf",
    },
  ],
} as const satisfies ResourceLinksData;

export const jesteiLandingsNote = {
  text: "Вместо одного общего лендинга запустили два. Каждый собрали из промомодулей под разные рекламные задачи и продуктовые сценарии.",
} as const satisfies SectionNoteData;

/**
 * Canonical PageContent must not inherit the legacy section-wrapper class that
 * the marker-based homepage composition stored inside the MediaGroup itself.
 */
export const jesteiCanonicalPromoSequence = {
  layout: jesteiPromoSequence.layout,
  captionView: jesteiPromoSequence.captionView,
  leading: jesteiPromoSequence.leading,
  middle: jesteiPromoSequence.middle,
  trailing: jesteiPromoSequence.trailing,
} as const satisfies MediaGroupData<MediaEntryId>;
