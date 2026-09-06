export type JesteiFilterChoiceSelection = "included" | "excluded";

export type JesteiFilterChoice = {
  value: string;
  selection: JesteiFilterChoiceSelection;
};

export type JesteiFilterSummaryState = {
  genres: JesteiFilterChoice[];
  tags: JesteiFilterChoice[];
  bpm: {
    min: number;
    max: number;
    defaultMin: number;
    defaultMax: number;
  };
  rating: number | null;
  top: boolean;
  trackTypes: JesteiFilterChoice[];
  nightParts: JesteiFilterChoice[];
  keys: JesteiFilterChoice[];
};

export type JesteiFilterSummaryGroup =
  | "genres"
  | "tags"
  | "bpm"
  | "rating"
  | "track-types"
  | "night-parts"
  | "keys";

export type JesteiFilterSummaryItem = {
  id: string;
  group: JesteiFilterSummaryGroup;
  selection?: JesteiFilterChoiceSelection;
  label: string;
  value: string;
  extraCount: number;
};

export function buildJesteiFilterSummary(
  _state: JesteiFilterSummaryState,
): JesteiFilterSummaryItem[] {
  return [];
}
