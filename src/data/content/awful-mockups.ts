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
  summary: "Редактируемая библиотека device- и print-мокапов для быстрой презентации интерфейсов, графики и кейсов.",
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
  title: "Готовые сцены для интерфейсов",
  paragraphs: [
    "Верхний блок показывает набор как витрину, а ниже те же мокапы раскрываются как отдельные рабочие сцены: телефон, монитор, парные устройства, горизонтальные и печатные композиции.",
    "Подборка собрана так, чтобы страница читалась с телефона: сначала сильная постановочная сцена, затем device-сцены, потом вариативность форматов и доказательство редактируемой PSD-структуры.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsStructureIntro = {
  title: "Файл остаётся редактируемым",
  paragraphs: [
    "Каждый мокап устроен как рабочий PSD, а не как плоская картинка: экран меняется через Smart Object, фон и объект отделены масками, цвет и фактура лежат в постобработке.",
    "Скриншоты Photoshop показывают реальную структуру слоёв. Это не декорация для страницы, а проверка того, что архив можно открыть, заменить контент и быстро собрать новый кадр.",
  ],
} as const satisfies SectionIntroData;

export const awfulMockupsPhotoshopGroup = {
  layout: "grid",
  captionView: "summary",
  columns: 2,
  mobileColumns: 1,
  items: [
    { entryId: "awful-mockups-photoshop-layers-full-use-01", loading: "lazy" },
    { entryId: "awful-mockups-photoshop-layers-detail-use-01", loading: "lazy" },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;
