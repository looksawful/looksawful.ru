import type { AnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type { MediaFigureData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "PSD-мокапы и презентация",
  period: "2026",
  summary: "Редактируемая PSD-библиотека для презентации интерфейсов, айдентики и графики.",
  lead:
    "Внутри разделены экран, объект, фон, цвет и постобработка. Мокап быстро адаптируется под проект, а не пересобирается как отдельная сцена с нуля.",
  links: [
    {
      label: "Скачать PSD",
      href: "https://disk.yandex.ru/d/wFgt0t6TfjAXcQ",
      rel: "noopener noreferrer",
      target: "_blank",
    },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulMockupsMedia = [
  { entryId: "awful-mockups-02-monitor-use-01", captionView: "summary" },
  { entryId: "awful-mockups-03-phone-fashion-use-01", captionView: "summary" },
  { entryId: "awful-mockups-11-square-use-01", captionView: "summary" },
  { entryId: "awful-mockups-16-landscape-use-01", captionView: "summary" },
  { entryId: "awful-mockups-17-dual-phone-use-01", captionView: "summary" },
  { entryId: "awful-mockups-18-phone-use-01", captionView: "summary" },
  { entryId: "awful-mockups-28-phone-camera-use-01", captionView: "summary" },
  { entryId: "awful-mockups-39-print-case-use-01", captionView: "summary" },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];

export const awfulMockupsShowcaseIntro = {
  title: "Витрина",
  paragraphs: [
    "Общий preview собирает разные носители в одну поверхность: так библиотека читается сразу, без просмотра всех файлов подряд.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsSelectionIntro = {
  title: "Мокапы",
  paragraphs: [
    "В подборке оставлены разные сценарии: рабочий экран, телефон в руке, парные устройства, печать и предметная сцена.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsPreviewGroup = {
  layout: "grid",
  captionView: "lightbox-only",
  columns: 4,
  mobileColumns: 1,
  items: awfulMockupsMedia.map(({ entryId }) => ({ entryId })),
} as const satisfies MediaGroupData<MediaEntryId>;

export const awfulMockupsCanvasGallery = {
  profile: "moves",
  variant: "showcase-diagonal",
  id: "awful-mockups-canvas",
  className: "awful-mockups-showcase",
  items: awfulMockupsMedia.map(({ entryId }) => ({ entryId, title: "" })),
} as const satisfies AnimatedCanvasGalleryData<MediaEntryId>;

export const awfulMockupsMockupDeck = {
  variant: "standard",
  device: "desktop",
  captionView: "lightbox-only",
  controls: false,
  captions: false,
  slides: [
    {
      kind: "canvas-gallery",
      className: "awful-mockups-slider-canvas-slide",
      captionView: "lightbox-only",
      caption: { title: "Awful Mockups" },
      gallery: awfulMockupsCanvasGallery,
    },
  ],
} as const satisfies MockupDeckData<MediaEntryId>;

export const awfulMockupsStructureIntro = {
  title: "PSD",
  paragraphs: [
    "Файлы собраны как редактируемые заготовки: экран меняется через Smart Object, а фон, маски, цветокоррекция и финальная обработка остаются отдельными слоями.",
    "Исходники вынесены в отдельный архив, чтобы PSD не раздували репозиторий и не смешивались с web-превью.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsPhotoshopGroup = {
  layout: "grid",
  captionView: "overlay",
  columns: 2,
  mobileColumns: 1,
  items: [
    { entryId: "awful-mockups-photoshop-layers-full-use-01", loading: "lazy" },
    { entryId: "awful-mockups-photoshop-layers-detail-use-01", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;
