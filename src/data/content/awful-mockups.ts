import type { AnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type { MediaFigureData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "PSD-мокапы, ретушь и презентационные сцены",
  period: "2026",
  summary: "Редактируемая библиотека мокапов устройств и печатных носителей для быстрой презентации интерфейсов, графики и кейсов.",
  lead:
    "Экран, объект, фон, маски, цвет и постобработка разделены по слоям. Поэтому сцену можно адаптировать под новый проект без повторной съёмки, рендера или сборки мокапа с нуля.",
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

export const awfulMockupsMedia = [
  { entryId: "awful-mockups-03-phone-fashion-use-01", captionView: "summary" },
  { entryId: "awful-mockups-02-monitor-use-01", captionView: "summary" },
  { entryId: "awful-mockups-17-dual-phone-use-01", captionView: "summary" },
  { entryId: "awful-mockups-28-phone-camera-use-01", captionView: "summary" },
  { entryId: "awful-mockups-16-landscape-use-01", captionView: "summary" },
  { entryId: "awful-mockups-11-square-use-01", captionView: "summary" },
  { entryId: "awful-mockups-18-phone-use-01", captionView: "summary" },
  { entryId: "awful-mockups-39-print-case-use-01", captionView: "summary" },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];

export const awfulMockupsPreviewGroup = {
  layout: "grid",
  captionView: "summary",
  columns: 2,
  mobileColumns: 1,
  items: [
    { entryId: "awful-mockups-03-phone-fashion-use-01", role: "wide", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-02-monitor-use-01", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-17-dual-phone-use-01", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-28-phone-camera-use-01", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-16-landscape-use-01", role: "wide", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-11-square-use-01", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-18-phone-use-01", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-39-print-case-use-01", captionFields: ["index", "title"] },
  ],
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

export const awfulMockupsShowcaseIntro = {
  title: "Сцены для разных форматов",
  paragraphs: [
    "В наборе есть постановочные кадры, мониторы, одиночные и парные телефоны, широкие композиции и печатные носители. Сцены рассчитаны на разные типы проектов, а не на один шаблон.",
    "Каждый кадр можно использовать как готовую презентационную сцену или быстро адаптировать под конкретный интерфейс, кампанию или кейс.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsStructureIntro = {
  title: "Редактируемая PSD-структура",
  paragraphs: [
    "Каждый мокап собран как рабочий PSD, а не как плоская картинка: экран меняется через Smart Object, фон и объект отделены масками, цвет и фактура остаются в постобработке.",
    "Скриншоты Photoshop показывают реальную структуру слоёв: исходник, объект, экран, фон, маски и постобработка разнесены по рабочим группам.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsPhotoshopGroup = {
  layout: "grid",
  captionView: "summary",
  columns: 2,
  mobileColumns: 1,
  items: [
    { entryId: "awful-mockups-photoshop-layers-full-use-01", loading: "lazy", captionFields: ["index", "title"] },
    { entryId: "awful-mockups-photoshop-layers-detail-use-01", loading: "lazy", captionFields: ["index", "title"] },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;
