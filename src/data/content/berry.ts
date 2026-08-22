import type { MockupData, ProjectIntroData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const berryIntro = {
  head: { type: "text", text: "Berry Agency" },
  title: { type: "text", text: "Berry Agency" },
  role: "СММ",
  period: "2020",
  summary: "Московское модельное агентство, которое занимается подбором моделей, организацией кастингов, созданием модельных портфолио, а также проведением фото- и видеосъёмок.",
  lead: "Работал фотографом и SMM-специалистом агентства, составлял контент-план, создавал дизайн постов, укомплектовал студию агентства оборудованием, снимал модельные тесты, коммерческие и эдиториал-фотосъёмки.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const berryStoryMockups = [
  { entryId: "berry-02-source-01-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-02-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-03-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
  { entryId: "berry-02-source-04-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay", loading: "lazy" },
] as const satisfies readonly MockupData<MediaEntryId>[];
