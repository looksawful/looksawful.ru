import type { AnimatedCanvasGalleryData } from "../../types/animated-canvas-gallery.ts";
import type { MediaFigureData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const movesAwfulIntro = {
  head: { type: "text", text: "Moves Awful" },
  title: { type: "text", text: "Moves Awful" },
  role: "Разработчик",
  period: "2025",
  summary: "Библиотека анимированных галерей для лендингов.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const movesAwfulAnimationsIntro = {
  title: "Анимации лендинга",
  paragraphs: ["На лендинге использовали Canvas-анимации и интерактивные виджеты. Лента показывает подборки треков, интерфейс и инструменты сервиса; отдельные модули — плейлисты и музыкальные жанры. Анимированные секции для клубных диджеев построены на библиотеке Moves Awful."],
} as const satisfies SectionIntroData;

export const movesAwfulLandingMedia = [
  { entryId: "moves-awful-jestei-landing-animation-01-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
  { entryId: "moves-awful-jestei-landing-animation-02-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
  { entryId: "moves-awful-jestei-landing-animation-03-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];

export const movesAwfulCanvasGallery = {
  profile: "moves",
  variant: "arc",
  id: "real-gallery",
  className: "animated-canvas-gallery",
  items: [
    { entryId: "obladaet-01-source-02-2x3-use-01", title: "" },
    { entryId: "obladaet-02-source-04-4x5-use-01", title: "" },
    { entryId: "evasha-05-source-01-1x1-use-01", title: "" },
    { entryId: "evasha-06-source-01-2x3-use-01", title: "" },
    { entryId: "evasha-07-source-02-121x125-use-01", title: "" },
    { entryId: "igguana-11-source-01-1x1-use-01", title: "" },
    { entryId: "igguana-11-source-05-2x3-use-01", title: "" },
    { entryId: "hypression-14-source-01-5x4-use-01", title: "" },
    { entryId: "hypression-15-source-02-256x181-use-01", title: "" },
    { entryId: "ofelia-19-source-01-4x5-use-01", title: "" },
    { entryId: "ofelia-19-source-03-1553x2135-use-01", title: "" },
    { entryId: "obladaet-04-source-01-4x5-use-01", title: "" },
    { entryId: "obladaet-03-source-03-1129x1280-use-01", title: "" },
    { entryId: "evasha-10-source-02-2x3-use-01", title: "" },
    { entryId: "hypression-17-source-01-4x5-use-01", title: "" },
    { entryId: "evasha-08-source-01-99x140-use-01", title: "" },
  ],
} as const satisfies AnimatedCanvasGalleryData<MediaEntryId>;
