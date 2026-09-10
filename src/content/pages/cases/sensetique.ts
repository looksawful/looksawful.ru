import {
  sensetiqueBuro247Group,
  sensetiqueChapurinBentoGroup,
  sensetiqueDaniilKorotechenkovSequence,
  sensetiqueEditorialProductionReel,
  sensetiqueHarshLightSlider,
  sensetiqueHarshLightStrip,
  sensetiqueInnaHonourReel,
  sensetiqueIntro,
  sensetiqueIvanKrushinskyEditorialStrip,
  sensetiqueKatyaKnyazevaEditorialGroup,
  sensetiqueKrasotaDressStrip,
  sensetiqueKrasotaDressVideo,
  sensetiqueOlovoArchitectureStrip,
  sensetiqueOlovoBackstageVideo,
  sensetiqueOlovoBookletGroup,
  sensetiqueOlovoCampaignStrip,
  sensetiqueOlovoLookbook2016Reel,
  sensetiqueOlovoLookbook2018Reel,
  sensetiqueProductionIntro,
  sensetiqueRaputoEditorialStrip,
  sensetiqueStudioInfiniteStrip,
  sensetiqueStudioIntro,
  sensetiqueStudioJustifiedGallery,
  sensetiqueStudioMockupDeck,
  sensetiqueTatianaNikishinaEditorialGroup,
  sensetiqueTatianaNikishinaSupplementalReel,
  sensetiqueWoodMetalPanicStrip,
  sensetiqueYoungPioneerSequence,
  sensetiqueYoungPioneerStrip,
  sensetiqueYuriIvanovEditorialGroup,
} from "../../../data/content/sensetique.ts";
import {
  sensetiqueCanonicalDigitalFearPageFlip,
  sensetiqueEquipmentResources,
  sensetiqueFashionProductionNote,
  sensetiqueHarshLightOuterCredits,
  sensetiqueKrasotaDressOuterCredits,
  sensetiqueMasterclassesCredits,
  sensetiqueMasterclassesNote,
  sensetiqueOlovoArchitectureOuterCredits,
  sensetiqueOlovoCampaignOuterCredits,
  sensetiquePublicationsNote,
} from "../../../data/content/sensetique-page-presentation.ts";
import { getSensetiqueEditorialSection } from "../../../data/content/sensetique-editorial.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";

const sensetiqueEquipmentEditorial = getSensetiqueEditorialSection("equipment");

/**
 * Canonical Sensetique composition follows the actual rendered article order.
 * Inline authored presentation that survived legacy Homepage post-processing is
 * represented explicitly here instead of being recovered from index.html.
 */
export const sensetiquePageContent = {
  pageId: "case:sensetique",
  intro: sensetiqueIntro,
  sections: [
    {
      type: "content",
      id: "sensetique-studio-preview",
      blocks: [{ type: "mockup-deck", data: sensetiqueStudioMockupDeck }],
    },
    {
      type: "content",
      id: "sensetique-studio",
      intro: sensetiqueStudioIntro,
      presentation: { separator: "before-blocks" },
      blocks: [{ type: "justified-gallery", data: sensetiqueStudioJustifiedGallery }],
    },
    {
      type: "content",
      id: "sensetique-equipment",
      heading: { text: sensetiqueEquipmentEditorial.title },
      resources: sensetiqueEquipmentResources,
      blocks: [{ type: "media-group", data: sensetiqueStudioInfiniteStrip }],
    },
    {
      type: "content",
      id: "sensetique-production",
      intro: sensetiqueProductionIntro,
      note: sensetiquePublicationsNote,
      presentation: {
        separator: "before-blocks",
        notePlacement: "after-blocks",
      },
      blocks: [],
    },
    {
      type: "project",
      id: "sensetique-harsh-light",
      projectId: "sensetique-harsh-light-2018",
      credits: sensetiqueHarshLightOuterCredits,
      presentation: { outerDivider: false },
      blocks: [
        { type: "media-slider", data: sensetiqueHarshLightSlider },
        { type: "media-group", data: sensetiqueHarshLightStrip },
      ],
    },
    {
      type: "project",
      id: "sensetique-raputo-editorial",
      projectId: "sensetique-editorial-andrey-raputo-02",
      blocks: [{ type: "media-group", data: sensetiqueRaputoEditorialStrip }],
    },
    {
      type: "project",
      id: "sensetique-young-pioneer-sequence",
      projectId: "sensetique-young-pioneer-kaltblut",
      blocks: [{ type: "media-group", data: sensetiqueYoungPioneerSequence }],
    },
    {
      type: "project",
      id: "sensetique-krasota-dress",
      projectId: "sensetique-krasota-dress-lookbook",
      credits: sensetiqueKrasotaDressOuterCredits,
      note: sensetiqueFashionProductionNote,
      blocks: [
        {
          type: "media-figure",
          data: sensetiqueKrasotaDressVideo,
          presentation: { mediaDimensions: false },
        },
        { type: "media-group", data: sensetiqueKrasotaDressStrip },
      ],
    },
    {
      type: "content",
      id: "sensetique-olovo-campaign-media",
      credits: sensetiqueOlovoCampaignOuterCredits,
      presentation: { layout: "media-stack" },
      blocks: [
        {
          type: "media-figure",
          data: sensetiqueOlovoBackstageVideo,
          presentation: { mediaDimensions: false },
        },
        { type: "media-group", data: sensetiqueOlovoCampaignStrip },
      ],
    },
    {
      type: "project",
      id: "sensetique-olovo-lookbook-2016",
      projectId: "sensetique-olovo-lookbook-2016",
      blocks: [{ type: "media-group", data: sensetiqueOlovoLookbook2016Reel }],
    },
    {
      type: "project",
      id: "sensetique-olovo-lookbook-2018",
      projectId: "sensetique-olovo-lookbook-2018",
      blocks: [{ type: "media-group", data: sensetiqueOlovoLookbook2018Reel }],
    },
    {
      type: "project",
      id: "sensetique-inna-honour",
      projectId: "sensetique-inna-honour-lookbook",
      blocks: [{ type: "media-group", data: sensetiqueInnaHonourReel }],
    },
    {
      type: "project",
      id: "sensetique-buro-24-7",
      projectId: "sensetique-buro-24-7-special",
      blocks: [{ type: "media-group", data: sensetiqueBuro247Group }],
    },
    {
      type: "project",
      id: "sensetique-olovo-architecture",
      projectId: "sensetique-olovo-brandbook-architecture",
      credits: sensetiqueOlovoArchitectureOuterCredits,
      blocks: [{ type: "media-group", data: sensetiqueOlovoArchitectureStrip }],
    },
    {
      type: "project",
      id: "sensetique-olovo-booklet",
      projectId: "sensetique-olovo-booklet-design",
      blocks: [{ type: "media-group", data: sensetiqueOlovoBookletGroup }],
    },
    {
      type: "project",
      id: "sensetique-digital-fear",
      projectId: "sensetique-digital-fear-of-love",
      blocks: [{ type: "page-flip", data: sensetiqueCanonicalDigitalFearPageFlip }],
    },
    {
      type: "project",
      id: "sensetique-chapurin",
      projectId: "sensetique-chapurin-editorial-2018",
      blocks: [{ type: "media-group", data: sensetiqueChapurinBentoGroup }],
    },
    {
      type: "project",
      id: "sensetique-young-pioneer-strip",
      projectId: "sensetique-young-pioneer-kaltblut",
      blocks: [{ type: "media-group", data: sensetiqueYoungPioneerStrip }],
    },
    {
      type: "project",
      id: "sensetique-daniil-korotechenkov",
      projectId: "sensetique-editorial-daniil-korotechenkov",
      blocks: [{ type: "media-group", data: sensetiqueDaniilKorotechenkovSequence }],
    },
    {
      type: "project",
      id: "sensetique-tatiana-nikishina",
      projectId: "sensetique-editorial-tatiana-nikishina",
      blocks: [{ type: "media-group", data: sensetiqueTatianaNikishinaEditorialGroup }],
    },
    {
      type: "project",
      id: "sensetique-tatiana-nikishina-supplemental",
      projectId: "sensetique-editorial-tatiana-nikishina",
      blocks: [{ type: "media-group", data: sensetiqueTatianaNikishinaSupplementalReel }],
    },
    {
      type: "project",
      id: "sensetique-katya-knyazeva",
      projectId: "sensetique-editorial-katya-knyazeva",
      blocks: [{ type: "media-group", data: sensetiqueKatyaKnyazevaEditorialGroup }],
    },
    {
      type: "project",
      id: "sensetique-wood-metal-panic",
      projectId: "sensetique-wood-metal-panic",
      blocks: [{ type: "media-group", data: sensetiqueWoodMetalPanicStrip }],
    },
    {
      type: "project",
      id: "sensetique-yuri-ivanov",
      projectId: "sensetique-editorial-yuri-ivanov",
      blocks: [{ type: "media-group", data: sensetiqueYuriIvanovEditorialGroup }],
    },
    {
      type: "project",
      id: "sensetique-ivan-krushinski",
      projectId: "sensetique-editorial-ivan-krushinski",
      blocks: [{ type: "media-group", data: sensetiqueIvanKrushinskyEditorialStrip }],
    },
    {
      type: "content",
      id: "sensetique-editorial-production",
      blocks: [{ type: "media-group", data: sensetiqueEditorialProductionReel }],
    },
    {
      type: "content",
      id: "sensetique-masterclasses",
      note: sensetiqueMasterclassesNote,
      credits: sensetiqueMasterclassesCredits,
      presentation: {
        outerDivider: false,
        headOrder: "note-credits",
      },
      blocks: [],
    },
  ],
} as const satisfies EntityPageContent;
