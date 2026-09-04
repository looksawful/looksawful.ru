import type { CreditsData, SectionNoteData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaEntryId } from "../media/index.ts";
import {
  styxBrandLookbookReel,
  styxLookbook2025Reel,
  styxLookbookMasonryGroup,
  styxPrintLinksGroup,
  styxProductionMediaGroup,
  styxScanographyCampaignGroup,
  styxScanographyGroup,
  styxScanographyStrip,
} from "./styx.ts";

function withoutLegacySectionShell<T extends MediaGroupData<MediaEntryId>>(
  data: T,
): Omit<T, "className"> {
  const { className: _legacySectionClassName, ...canonical } = data;
  return canonical;
}

export const styxCanonicalProductionMediaGroup = withoutLegacySectionShell(
  styxProductionMediaGroup,
);

export const styxCanonicalScanographyGroup = withoutLegacySectionShell(styxScanographyGroup);
export const styxCanonicalPrintLinksGroup = withoutLegacySectionShell(styxPrintLinksGroup);
export const styxCanonicalScanographyCampaignGroup = withoutLegacySectionShell(
  styxScanographyCampaignGroup,
);
export const styxCanonicalBrandLookbookReel = withoutLegacySectionShell(styxBrandLookbookReel);
export const styxCanonicalLookbookMasonryGroup = withoutLegacySectionShell(
  styxLookbookMasonryGroup,
);
export const styxCanonicalScanographyStrip = withoutLegacySectionShell(styxScanographyStrip);
export const styxCanonicalLookbook2025Reel = withoutLegacySectionShell(styxLookbook2025Reel);

export const styxProductionMockupNote = {
  text: "Вместо одного общего лендинга запустили два. Каждый собрали из промомодулей под разные рекламные задачи и продуктовые сценарии.",
} as const satisfies SectionNoteData;

export const styxSocialInstructionCredits = {
  title: "Дизайн инструкции в социальных сетях.",
} as const satisfies CreditsData;

export const styxSocialInstructionNote = {
  text: "Дизайн инструкции в социальных сетях.",
} as const satisfies SectionNoteData;
