import {
  jesteiBrandIntro,
  jesteiBrandSystemGroup,
  jesteiEditorialIntro,
  jesteiEventGroup,
  jesteiEventIntro,
  jesteiFeaturedMedia,
  jesteiHomeIntro,
  jesteiHomeMockup,
  jesteiInstagramPlayerIntro,
  jesteiInstagramPlayerStrip,
  jesteiInterfaceGroup,
  jesteiInterfaceIntro,
  jesteiIntro,
  jesteiLandingsIntro,
  jesteiLandingsMockup,
  jesteiPromoIntro,
  jesteiRedpolitikaMockup,
  jesteiSubscriptionBeforeAfter,
} from "../../../data/content/jestei-pool.ts";
import {
  jesteiCanonicalPromoSequence,
  jesteiEditorialResources,
} from "../../../data/content/jestei-page-presentation.ts";
import { jesteiThemeOrganismMockup } from "../../../data/content/jestei-theme-organism.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

/**
 * Canonical composition for the registered Jestei Pool entity page.
 *
 * Both the standalone case page and Home reuse this PageContent through the
 * entity-page registry. The track filter remains a specialized renderer inside
 * the canonical composition because its DOM/runtime contract is project-specific.
 */
export const jesteiPoolPageContent = {
  pageId: "case:jestei-pool",
  intro: jesteiIntro,
  sections: [
    {
      type: "content",
      id: "jestei-featured",
      blocks: [{ type: "media-figure", data: jesteiFeaturedMedia }],
    },
    {
      type: "project",
      id: "jestei-home",
      projectId: "jestei-core-interface",
      intro: jesteiHomeIntro,
      blocks: [{ type: "mockup", data: jesteiHomeMockup }],
    },
    {
      type: "project",
      id: "jestei-brand",
      projectId: "jestei-brand-system",
      intro: jesteiBrandIntro,
      presentation: { separator: "between-blocks" },
      blocks: [
        { type: "jestei-theme", data: jesteiThemeOrganismMockup },
        { type: "media-group", data: jesteiBrandSystemGroup },
      ],
    },
    {
      type: "project",
      id: "jestei-interface",
      projectId: "jestei-core-interface",
      intro: jesteiInterfaceIntro,
      presentation: { separator: "before-blocks" },
      blocks: [{ type: "media-group", data: jesteiInterfaceGroup }],
    },
    {
      type: "project",
      id: "jestei-editorial",
      projectId: "jestei-editorial-policy",
      intro: jesteiEditorialIntro,
      resources: jesteiEditorialResources,
      blocks: [{ type: "mockup", data: jesteiRedpolitikaMockup }],
    },
    {
      type: "project",
      id: "jestei-event",
      projectId: "jestei-event",
      intro: jesteiEventIntro,
      presentation: { separator: "before-blocks" },
      blocks: [{ type: "media-group", data: jesteiEventGroup }],
    },
    {
      type: "project",
      id: "jestei-instagram-player",
      projectId: "jestei-promo-communication",
      intro: jesteiInstagramPlayerIntro,
      blocks: [{ type: "media-group", data: jesteiInstagramPlayerStrip }],
    },
    {
      type: "project",
      id: "jestei-landings",
      projectId: "jestei-landings",
      intro: jesteiLandingsIntro,
      blocks: [{ type: "mockup", data: jesteiLandingsMockup }],
    },
    {
      type: "specialized",
      kind: "jestei-track-filter",
      id: "jestei-track-filter",
      projectId: "jestei-track-filter",
    },
    {
      type: "project",
      id: "jestei-subscription",
      projectId: "jestei-subscription",
      blocks: [{ type: "before-after", data: jesteiSubscriptionBeforeAfter }],
    },
    {
      type: "project",
      id: "jestei-promo",
      projectId: "jestei-promo-communication",
      intro: jesteiPromoIntro,
      blocks: [{ type: "media-group", data: jesteiCanonicalPromoSequence }],
    },
  ],
} as const satisfies EntityPageContent;
