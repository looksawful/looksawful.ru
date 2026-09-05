import {
  shootingsEsmiBanner,
  shootingsEsmiIntro,
  shootingsEvashaBanner,
  shootingsEvashaCoverReel,
  shootingsEvashaIntro,
  shootingsEvashaMixedGroup,
  shootingsEvashaPairFigure,
  shootingsEvashaPortraitReel,
  shootingsEvashaPortraitsGroup,
  shootingsHypressionBanner,
  shootingsHypressionCollageGroup,
  shootingsHypressionIntro,
  shootingsHypressionMixedMediaGroup,
  shootingsHypressionPortraitsGroup,
  shootingsIgguanaIntro,
  shootingsIgguanaMasonryGroup,
  shootingsIntro,
  shootingsObladaetCollageReel,
  shootingsObladaetIntro,
  shootingsObladaetMixedMediaReel,
  shootingsObladaetPairGroup,
  shootingsObladaetPortraitsGroup,
  shootingsOfeliaIntro,
  shootingsOfeliaStrip,
} from "../../../data/content/shootings.ts";
import type { MediaEntryId } from "../../../data/media/index.ts";
import type { MediaGroupData } from "../../../types/media-group.ts";
import type { MediaFigureData } from "../../../types/media-presentation.ts";
import type { ContentBlock } from "../../contracts/content-block.ts";
import type { EntityPageContent } from "../../contracts/page-content.ts";
import { withoutLegacySectionFrame } from "../legacy-frame.ts";

function mediaGroup(data: MediaGroupData<MediaEntryId>): ContentBlock {
  return {
    type: "media-group",
    data: withoutLegacySectionFrame(data),
  };
}

function mediaFigure(data: MediaFigureData<MediaEntryId>): ContentBlock {
  return {
    type: "media-figure",
    data: withoutLegacySectionFrame(data),
  };
}

export const shootingsPageContent = {
  pageId: "collection:music-photography",
  intro: shootingsIntro,
  sections: [
    {
      type: "project",
      id: "shootings-obladaet",
      projectId: "shootings-obladaet",
      intro: shootingsObladaetIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-obladaet-collage",
      projectId: "shootings-obladaet",
      blocks: [mediaGroup(shootingsObladaetCollageReel)],
    },
    {
      type: "project",
      id: "shootings-obladaet-portraits",
      projectId: "shootings-obladaet",
      blocks: [mediaGroup(shootingsObladaetPortraitsGroup)],
    },
    {
      type: "project",
      id: "shootings-obladaet-mixed-media",
      projectId: "shootings-obladaet",
      blocks: [mediaGroup(shootingsObladaetMixedMediaReel)],
    },
    {
      type: "project",
      id: "shootings-obladaet-pair",
      projectId: "shootings-obladaet",
      blocks: [mediaGroup(shootingsObladaetPairGroup)],
    },
    {
      type: "project",
      id: "shootings-evasha",
      projectId: "shootings-evasha",
      intro: shootingsEvashaIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-evasha-banner",
      projectId: "shootings-evasha",
      blocks: [mediaFigure(shootingsEvashaBanner)],
    },
    {
      type: "project",
      id: "shootings-evasha-portraits-reel",
      projectId: "shootings-evasha",
      blocks: [mediaGroup(shootingsEvashaPortraitReel)],
    },
    {
      type: "project",
      id: "shootings-evasha-covers-reel",
      projectId: "shootings-evasha",
      blocks: [mediaGroup(shootingsEvashaCoverReel)],
    },
    {
      type: "project",
      id: "shootings-evasha-mixed",
      projectId: "shootings-evasha",
      blocks: [mediaGroup(shootingsEvashaMixedGroup)],
    },
    {
      type: "project",
      id: "shootings-evasha-pair",
      projectId: "shootings-evasha",
      blocks: [mediaFigure(shootingsEvashaPairFigure)],
    },
    {
      type: "project",
      id: "shootings-evasha-portraits",
      projectId: "shootings-evasha",
      blocks: [mediaGroup(shootingsEvashaPortraitsGroup)],
    },
    {
      type: "project",
      id: "shootings-igguana",
      projectId: "shootings-igguana",
      intro: shootingsIgguanaIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-igguana-masonry",
      projectId: "shootings-igguana",
      blocks: [mediaGroup(shootingsIgguanaMasonryGroup)],
    },
    {
      type: "project",
      id: "shootings-esmi",
      projectId: "shootings-esmi",
      intro: shootingsEsmiIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-esmi-banner",
      projectId: "shootings-esmi",
      credits: {
        lines: ["Фотограф Иван Крушинский"],
      },
      blocks: [mediaFigure(shootingsEsmiBanner)],
    },
    {
      type: "project",
      id: "shootings-hypression",
      projectId: "shootings-hypression",
      intro: shootingsHypressionIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-hypression-banner",
      projectId: "shootings-hypression",
      blocks: [mediaFigure(shootingsHypressionBanner)],
    },
    {
      type: "project",
      id: "shootings-hypression-collage",
      projectId: "shootings-hypression",
      blocks: [mediaGroup(shootingsHypressionCollageGroup)],
    },
    {
      type: "project",
      id: "shootings-hypression-mixed-media",
      projectId: "shootings-hypression",
      blocks: [mediaGroup(shootingsHypressionMixedMediaGroup)],
    },
    {
      type: "project",
      id: "shootings-hypression-portraits",
      projectId: "shootings-hypression",
      blocks: [mediaGroup(shootingsHypressionPortraitsGroup)],
    },
    {
      type: "project",
      id: "shootings-ofelia",
      projectId: "shootings-ofelia",
      intro: shootingsOfeliaIntro,
      blocks: [],
    },
    {
      type: "project",
      id: "shootings-ofelia-strip",
      projectId: "shootings-ofelia",
      blocks: [mediaGroup(shootingsOfeliaStrip)],
    },
  ],
} as const satisfies EntityPageContent;
