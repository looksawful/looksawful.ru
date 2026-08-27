import type { MockupDevice } from "./media-presentation.ts";

export type JesteiThemeName =
  | "neutral"
  | "basic"
  | "event"
  | "pro"
  | "feature";

export interface JesteiThemeTokenData {
  name: string;
  value: `#${string}`;
  rgb: `${number} ${number} ${number}`;
}

export interface JesteiThemeData {
  name: JesteiThemeName;
  label: string;
  description: string;
  tokens: readonly JesteiThemeTokenData[];
}

export interface JesteiThemeOrganismMockupData<EntryId extends string = string> {
  modelEntryId: EntryId;
  dracoPath: string;
  className?: string;
  device: MockupDevice;
  theme?: "dark";
  ratio?: string;
  ariaLabel: string;
  loadingLabel: string;
  initialTheme: JesteiThemeName;
  themes: readonly [JesteiThemeData, ...JesteiThemeData[]];
}
