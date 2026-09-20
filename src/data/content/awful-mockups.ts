import type { ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "PSD-мокапы",
  period: "2026",
  summary: "Набор редактируемых мокапов для интерфейсов и графики.",
  lead: "Экран, фон и постобработка разделены по слоям.",
  linksLabel: "Исходники",
  links: [
    {
      label: "Скачать PSD",
      href: "https://disk.yandex.ru/d/wFgt0t6TfjAXcQ",
      rel: "noopener noreferrer",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulMockupsPreviewGroup = {
  layout: "grid",
  captionView: "lightbox-only",
  columns: 2,
  mobileColumns: 1,
  items: [
    { entryId: "awful-mockups-03-phone-fashion-use-01", role: "wide" },
    { entryId: "awful-mockups-02-monitor-use-01" },
    { entryId: "awful-mockups-17-dual-phone-use-01" },
    { entryId: "awful-mockups-28-phone-camera-use-01" },
    { entryId: "awful-mockups-16-landscape-use-01", role: "wide" },
    { entryId: "awful-mockups-11-square-use-01" },
    { entryId: "awful-mockups-18-phone-use-01" },
    { entryId: "awful-mockups-39-print-case-use-01" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const awfulMockupsShowcaseIntro = {
  title: "Мокапы",
  paragraphs: ["Зелёный экран — заменяемая область."],
} as const satisfies SectionIntroData;

export const awfulMockupsStructureIntro = {
  title: "PSD",
  paragraphs: ["Один из исходников с раскрытыми слоями в Photoshop."],
} as const satisfies SectionIntroData;

export const awfulMockupsPhotoshopGroup = {
  layout: "grid",
  captionView: "lightbox-only",
  columns: 1,
  mobileColumns: 1,
  items: [{ entryId: "awful-mockups-photoshop-layers-full-use-01", loading: "lazy" }],
} as const satisfies MediaGroupData<MediaEntryId>;
