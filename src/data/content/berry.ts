import type { MockupData, ProjectIntroData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";
import { berryEditorialContent } from "./berry-editorial.ts";

export const berryIntro = {
  head: { type: "text", text: berryEditorialContent.head },
  title: { type: "text", text: berryEditorialContent.title },
  role: berryEditorialContent.role,
  period: berryEditorialContent.period,
  summary: berryEditorialContent.summary,
  lead: berryEditorialContent.lead,
} as const satisfies ProjectIntroData<LogoUsageId>;

export const berryStoryMockups = [
  { entryId: "berry-02-source-01-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-02-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-03-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-04-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
] as const satisfies readonly MockupData<MediaEntryId>[];
