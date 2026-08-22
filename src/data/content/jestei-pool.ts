import type {
  MediaFigureData,
  MockupData,
  ProjectIntroData,
  SectionIntroData,
} from "../../types/content.ts";

import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

export const jesteiIntro = {
  headLogoUsageId: "jestei-case-head-logo",

  title: {
    type: "logo",
    logoUsageId: "jestei-case-title-logo",
  },

  role: "Арт-директор",
  period: "2024–2026",

  lead: "Я сформировал новый визуальный язык главного российского диджейского пула, разработал UX/UI-стратегию для core-продуктов и руководил всей командой дизайнеров проекта в течение двух с половиной лет.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const jesteiFeaturedMedia = {
  entryId: "jestei-01-source-01-823x419-use-01",

  presentation: "banner",
  captionRest: "summary",

  loading: "lazy",
} as const satisfies MediaFigureData<MediaEntryId>;

export const jesteiHomeIntro = {
  title: "Главная страница",

  paragraphs: [
    "На главной странице сервиса пользователям показываются баннеры о свежих обновлениях контента. Мы полностью перестроили процесс создания баннеров, внедрили нейросети для генерации изображений вместо использования фотографий со стоков, переработали адаптивность компонента, сократив количество разрабатываемых баннеров для каждой рубрики с пяти до двух, перешли к таргетированному показу баннеров, подходящих конкретному пользователю — например, мы перестали показывать все баннеры об обновлениях в ивент-разделе клубным диджеям, которые не заходят в раздел ивент и не пытаются взаимодействовать с ним, и разработали концепции для рубрик, благодаря чему креативы стали последовательными и узнаваемыми.",
  ],
} as const satisfies SectionIntroData;

export const jesteiHomeMockup = {
  entryId: "jestei-02-source-01-16x10-use-01",

  device: "desktop",
  role: "wide",

  captionRest: "summary",

  loading: "eager",
} as const satisfies MockupData<MediaEntryId>;
