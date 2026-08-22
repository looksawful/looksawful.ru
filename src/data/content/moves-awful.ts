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
  paragraphs: ["Для лендинга мы начали активно использовать canvas-анимации и интерактивные виджеты. В лендинге мы стали показывать ленту с подборками треков, сразу знакомящую пользователя с интерфейсом и инструментами сервиса, показали плейлисты и рассказали о музыкальных жанрах, которые представлены на сервисе. Для анимированных секций лендинга для клубных диджеев мы использовали мою библиотеку анимаций Moves Awful."],
} as const satisfies SectionIntroData;

export const movesAwfulLandingMedia = [
  { entryId: "moves-awful-jestei-landing-animation-01-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
  { entryId: "moves-awful-jestei-landing-animation-02-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
  { entryId: "moves-awful-jestei-landing-animation-03-use-01", captionView: "overlay", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } },
] as const satisfies readonly MediaFigureData<MediaEntryId>[];
