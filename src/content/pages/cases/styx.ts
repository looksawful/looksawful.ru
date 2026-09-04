import {
  styxBrandIntro,
  styxCatalogMockup,
  styxGiftCertificateSlider,
  styxIntro,
  styxLogoBanner,
  styxLookbookIntro,
  styxProductionIntro,
  styxProductionMockupDeck,
  styxScanographyIntro,
  styxShootingsIntro,
  styxSocialInstructionMockupDeck,
} from "../../../data/content/styx.ts";
import {
  styxCanonicalBrandLookbookReel,
  styxCanonicalLookbook2025Reel,
  styxCanonicalLookbookMasonryGroup,
  styxCanonicalPrintLinksGroup,
  styxCanonicalProductionMediaGroup,
  styxCanonicalScanographyCampaignGroup,
  styxCanonicalScanographyGroup,
  styxCanonicalScanographyStrip,
  styxProductionMockupNote,
  styxSocialInstructionCredits,
  styxSocialInstructionNote,
} from "../../../data/content/styx-page-presentation.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

/**
 * Canonical Styx composition follows the actual current index.html render order.
 * The old home-slot declaration order is not authoritative because markers were
 * replaced in-place inside the authored HTML template.
 */
export const styxPageContent = {
  pageId: "case:styx",
  intro: styxIntro,
  sections: [
    {
      type: "project",
      id: "styx-brand",
      projectId: "styx-brand-system",
      intro: styxBrandIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "styx-logo-banner",
      projectId: "styx-brand-system",
      blocks: [{ type: "media-figure", data: styxLogoBanner }],
    },
    {
      type: "content",
      id: "styx-production-preview",
      note: styxProductionMockupNote,
      presentation: { notePlacement: "after-blocks" },
      blocks: [{ type: "mockup-deck", data: styxProductionMockupDeck }],
    },
    {
      type: "content",
      id: "styx-production",
      intro: styxProductionIntro,
      blocks: [],
    },
    {
      type: "content",
      id: "styx-production-media",
      blocks: [{ type: "media-group", data: styxCanonicalProductionMediaGroup }],
    },
    {
      type: "content",
      id: "styx-scanography",
      intro: styxScanographyIntro,
      blocks: [],
    },
    {
      type: "content",
      id: "styx-scanography-media",
      blocks: [{ type: "media-group", data: styxCanonicalScanographyGroup }],
    },
    {
      type: "project",
      id: "styx-brand-lookbook-2023",
      projectId: "styx-lookbook-2023",
      blocks: [{ type: "media-group", data: styxCanonicalBrandLookbookReel }],
    },
    {
      type: "project",
      id: "styx-catalog",
      projectId: "styx-panoramic-catalog-2021",
      blocks: [{ type: "mockup", data: styxCatalogMockup }],
    },
    {
      type: "content",
      id: "styx-shootings",
      intro: styxShootingsIntro,
      blocks: [],
    },
    {
      type: "content",
      id: "styx-lookbook-masonry",
      blocks: [{ type: "media-group", data: styxCanonicalLookbookMasonryGroup }],
    },
    {
      type: "content",
      id: "styx-gift-certificate",
      blocks: [{ type: "media-slider", data: styxGiftCertificateSlider }],
    },
    {
      type: "content",
      id: "styx-print-links",
      blocks: [{ type: "media-group", data: styxCanonicalPrintLinksGroup }],
    },
    {
      type: "project",
      id: "styx-scanography-campaign",
      projectId: "styx-scanographic-campaign-2022",
      blocks: [{ type: "media-group", data: styxCanonicalScanographyCampaignGroup }],
    },
    {
      type: "content",
      id: "styx-scanography-strip",
      blocks: [{ type: "media-group", data: styxCanonicalScanographyStrip }],
    },
    {
      type: "content",
      id: "styx-lookbook",
      intro: styxLookbookIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "styx-lookbook-2025",
      projectId: "styx-lookbook-2025",
      blocks: [{ type: "media-group", data: styxCanonicalLookbook2025Reel }],
    },
    {
      type: "project",
      id: "styx-social-instructions",
      projectId: "styx-social-instructions",
      credits: styxSocialInstructionCredits,
      note: styxSocialInstructionNote,
      presentation: {
        layout: "split-always",
        notePlacement: "after-blocks",
      },
      blocks: [{ type: "mockup-deck", data: styxSocialInstructionMockupDeck }],
    },
  ],
} as const satisfies EntityPageContent;
