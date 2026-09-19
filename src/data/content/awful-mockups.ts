import type { AnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type { MediaFigureData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MockupDeckData } from "../../types/mockup-deck.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const awfulMockupsIntro = {
  head: { type: "text", text: "Awful Mockups" },
  title: { type: "text", text: "Awful Mockups" },
  role: "Дизайн и ретушь",
  period: "2026",
  summary: "PSD-мокапы телефона и ноутбука для презентации интерфейсов и графики.",
  lead:
    "Экран, корпус, фон и обработка разделены по слоям. Можно быстро менять изображение, цвет и фон, не собирая сцену заново.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulMockupsMedia = [
  { entryId: "awful-mockups-03-phone-fashion-use-01", captionView: "summary" },
  { entryId: "awful-mockups-17-dual-phone-use-01", captionView: "summary" },
  { entryId: "awful-mockups-28-phone-camera-use-01", captionView: "summary" },
  { entryId: "awful-mockups-39-print-case-use-01", captionView: "summary" },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];

export const awfulMockupsCanvasGallery = {
  profile: "moves",
  variant: "showcase-diagonal",
  id: "awful-mockups-showcase",
  className: "animated-canvas-gallery",
  items: awfulMockupsMedia.map(({ entryId }) => ({ entryId, title: "" })),
} as const satisfies AnimatedCanvasGalleryData<MediaEntryId>;

export const awfulMockupsMockupDeck = {
  variant: "standard",
  device: "desktop",
  captionView: "summary",
  controls: true,
  captions: false,
  slides: awfulMockupsMedia.map(({ entryId }) => ({
    entryId,
    captionView: "summary" as const,
    mediaDimensions: false,
  })),
} as const satisfies MockupDeckData<MediaEntryId>;

export const awfulMockupsStructureIntro = {
  title: "Как устроены мокапы",
  paragraphs: [
    "Файлы остаются редактируемыми: экран, устройство, фон и постобработка не склеены в один слой.",
    "В наборе есть разные ракурсы и сцены для интерфейсов, айдентики и графики.",
  ],
} as const satisfies SectionIntroData;
