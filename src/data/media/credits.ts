import type { MediaCreditsData } from "../../types/media.ts";

// Structured credits will be populated after reconciling the markup inventory
// with the canonical data source. Current credit strings are preserved losslessly
// in MediaEntry.caption.meta until that reconciliation is complete.
export const mediaCredits = [] as const satisfies readonly MediaCreditsData[];

export type MediaCredits = (typeof mediaCredits)[number];
export type MediaCreditsId = MediaCredits["id"];
