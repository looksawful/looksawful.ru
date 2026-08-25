import type { BeforeAfterData } from "../../types/before-after.ts";
import type { MediaFigureData, MockupData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import type { MediaGroupData } from "../../types/media-group.ts";
import { getCase, getRole } from "../catalog/lookup.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

const jesteiCase = getCase("jestei-pool");
const artDirectorRole = getRole("art-director");

export const jesteiIntro = {
  head: { type: "logo", logoUsageId: "jestei-case-head-logo", wrapper: "none" },
  title: { type: "logo", logoUsageId: "jestei-case-title-logo" },
  role: artDirectorRole.name,
  period: jesteiCase.date,
  lead: jesteiCase.summary,
} as const satisfies ProjectIntroData<LogoUsageId>;

export const jesteiFeaturedMedia = { entryId: "jestei-01-source-01-823x419-use-01", presentation: "banner", captionView: "summary", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;
export const jesteiHomeIntro = { title: "Персонализация", paragraphs: ["На главной Jestei Pool пользователи видят баннеры о новых релизах и обновлениях контента. Мы заменили стоковые фотографии генеративными изображениями и переработали адаптивность компонента. В результате сократили расходы на производство баннеров в 2,5 раза. Ввели показ по интересам пользователя. Например, клубные диджеи, которые не заходят в Event, больше не видят его обновления. Для регулярных рубрик разработали свои визуальные концепции, поэтому креативы стали последовательными и узнаваемыми."] } as const satisfies SectionIntroData;
export const jesteiHomeMockup = { entryId: "jestei-02-source-01-16x10-use-01", device: "desktop", role: "wide", captionView: "summary", loading: "eager" } as const satisfies MockupData<MediaEntryId>;
export const jesteiBrandIntro = { title: "Ребрендинг", bodyClassName: "brand-system__intro", paragraphs: ["Провели ребрендинг Jestei Pool: серьёзно переработали логотип, обновили типографику и сделали цвет частью продуктовой навигации. Новую айдентику встроили в интерфейс и дизайн-систему."] } as const satisfies SectionIntroData;
export const jesteiInterfaceIntro = { title: "Продукт", bodyClassName: "jestei-section-copy-list", paragraphs: ["Сгруппировали плейлисты и добавили заголовки и описания. Наняли редактора и вместе с диджеями описали больше 200 плейлистов и все жанры. Для каждой группы разработали свой стиль обложек вместо однообразных стоковых картинок.", "Разработали алгоритмические плейлисты. Они собирают популярные треки по жанру или части мероприятия и исключают музыку, которую пользователь уже слышал. Например, плейлист может предложить десять популярных треков для праймтайма или афтерпати, которые пользователь ещё не знает.", "Полностью переделали сценарий покупки подписки. Объяснили разницу между тарифами и обозначили предложения для разных сегментов своими цветами."] } as const satisfies SectionIntroData;
export const jesteiEditorialIntro = { title: "Коммуникации", paragraphs: ["Собрали единые правила для tone of voice, терминологии, UX-текстов, интерфейсных текстов и редакционной работы Jestei Pool."] } as const satisfies SectionIntroData;
export const jesteiRedpolitikaMockup = { entryId: "jestei-redpolitika-preview-use-01", device: "desktop", role: "wide", captionView: "lightbox-only", loading: "lazy", mediaClassName: "fit-cover" } as const satisfies MockupData<MediaEntryId>;
export const jesteiEventIntro = { title: "Масштабы", bodyClassName: "jestei-section-copy-list", paragraphs: ["Добавили на лендинг Canvas-анимации и интерактивные виджеты. Лента с треками знакомит пользователя с интерфейсом и инструментами сервиса прямо на странице. Там же показали плейлисты и музыкальные жанры. Анимации для клубных диджеев сделали на моей библиотеке Moves Awful.", "Спрос в ивент-диджеинге зависит от сезона, поэтому его можно прогнозировать. Мы исследовали, какие плейлисты чаще всего нужны ивент-диджеям. Разделили музыку на сезонную и постоянную, а актуальные подборки подняли выше в навигации.", "Создали виджеты с предложением перейти на следующий тариф и встроили апгрейд подписки прямо в интерфейс.", "Разделили отдельные плейлисты и коллекции. Добавили подсказки и описания к группам. Стоковые картинки заменили дизайнерскими обложками."] } as const satisfies SectionIntroData;

export const jesteiEventGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "jestei-event-group jestei-captioned-group",
  captionView: "summary",
  items: [
    {
      entryId: "jestei-landings-moves-awful-source-01-use-jestei",
      className: "jestei-captioned-media jestei-event-video-item",
      surfaceClassName: "jestei-event-video-surface",
      surface: { ratio: "2248 / 1265" },
      captionFields: ["index", "title"],
      surfaceDeck: {
        className: "jestei-event-video-deck",
        autoplay: "off",
        advanceOnEnded: true,
        slides: [
          {
            entryId: "jestei-landings-moves-awful-source-01-use-jestei",
            video: {
              autoplay: true,
              muted: true,
              playsInline: true,
              preload: "metadata",
            },
          },
          {
            entryId: "jestei-landings-moves-awful-source-02-use-jestei",
            video: { muted: true, playsInline: true, preload: "metadata" },
          },
          {
            entryId: "jestei-landings-moves-awful-source-03-use-jestei",
            video: { muted: true, playsInline: true, preload: "metadata" },
          },
        ],
      },
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[0],
      },
    },
    {
      entryId: "jestei-03-source-01-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[1],
      },
      loading: "lazy",
    },
    {
      entryId: "jestei-03-source-03-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[2],
      },
      loading: "lazy",
    },
    {
      entryId: "jestei-03-source-04-16x9-use-01",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: jesteiEventIntro.paragraphs[3],
      },
      loading: "lazy",
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiLandingsIntro = { title: "Лендинги", paragraphs: ["К 2025 году один лендинг перестал описывать весь Jestei Pool. Появились новые инструменты и сценарии, а Event стал отдельным направлением. Мы активнее использовали таргетированную рекламу, поэтому разным аудиториям понадобились разные предложения. Запустили два лендинга и собрали каждый из промомодулей под свои рекламные задачи."] } as const satisfies SectionIntroData;
export const jesteiLandingsMockup = { entryId: "jestei-13-source-13-1280x588-use-01", device: "desktop", captionView: "summary", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } } as const satisfies MockupData<MediaEntryId>;
export const jesteiPromoIntro = { title: "Дизайн", paragraphs: ["Отказались от однообразного стокового контента для плейлистов, регулярных рубрик и сезонных подборок. Вместо него использовали метафоры, коллажи, иллюстрации и нейросети. Для каждой рубрики разработали свой визуальный подход."] } as const satisfies SectionIntroData;


export const jesteiInstagramPlayerStrip = {
  "layout": "strip",
  "captionView": "overlay",
  "infiniteReel": {
    "duration": "30s"
  },
  "items": [
    {
      "entryId": "jestei-04-source-01-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-02-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-03-9x16-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-04-323x623-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-05-323x623-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-04-source-06-323x623-use-01",
      "loading": "lazy"
    }
  ]
} as const satisfies MediaGroupData<MediaEntryId>;


export const jesteiPromoSequence = {
  "layout": "sequence",
  "className": "project__section wrapper",
  "captionView": "overlay",
  "leading": {
    "entryId": "jestei-05-source-01-701x452-use-01",
    "loading": "lazy"
  },
  "middle": [
    {
      "entryId": "jestei-05-source-02-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-03-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-04-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-05-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-06-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-07-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-08-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-09-1x1-use-01",
      "loading": "lazy"
    },
    {
      "entryId": "jestei-05-source-10-1x1-use-01",
      "loading": "lazy"
    }
  ],
  "trailing": {
    "entryId": "jestei-05-source-11-3x2-use-01",
    "loading": "lazy"
  }
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiBrandSystemGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "brand-system",
  captionView: "summary",
  items: [
    {
      entryId: "jestei-system-logo-source-logo-anatomy-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Серьёзно переработали логотип Jestei Pool. Заново построили геометрию знака и описали правила его применения в интерфейсе, айдентике и промоматериалах.",
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-color-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Связали цвет с продуктовой навигацией. Оранжевый обозначает клубный продукт, зелёный — Event, синий — Pro. Для новых функций добавили отдельный цвет.",
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-type-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Для нового логотипа сделали полную и сокращённую версии. Задали пропорции знака и шрифтовой части и описали правила применения в разных форматах.",
      },
    },
    {
      entryId: "jestei-system-logo-source-logo-system-01-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Новую айдентику встроили в дизайн-систему. Связали логотип, типографику и цвет с интерфейсными правилами. Теперь один визуальный язык работает и в продукте, и в коммуникации.",
      },
    },
    {
      entryId: "jestei-system-type-source-logo-druk-slide-use-01",
      loading: "lazy",
      className: "brand-system__item",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Добавили Druk Wide для крупных заголовков и промокоммуникации. Функциональный текст оставили на основном интерфейсном шрифте.",
      },
    },
    {
      entryId: "jestei-10-source-17-101x50-use-01",
      loading: "lazy",
      className: "brand-system__item brand-system__item--light",
      mediaClassName: "fit-contain",
      surfaceClassName: "brand-system__surface",
      surface: { deriveRatio: false },
      captionClassName: "brand-system__caption",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "brand-system__hover-copy",
        text: "Разделили аудиторию на клубных диджеев, ивент-диджеев и саунд-продюсеров. Для каждой группы настроили свои продуктовые предложения, навигацию и коммуникацию.",
      },
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiInterfaceGroup = {
  layout: "grid",
  mode: "compact-reel",
  className: "jestei-interface-group jestei-captioned-group",
  captionView: "summary",
  columns: 3,
  items: [
    {
      entryId: "jestei-02-source-02-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: "Сгруппировали плейлисты и добавили заголовки и описания. Наняли редактора и вместе с диджеями описали больше 200 плейлистов и все жанры. Для каждой группы разработали свой стиль обложек вместо однообразных стоковых картинок.",
      },
    },
    {
      entryId: "jestei-02-source-03-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: "Разработали алгоритмические плейлисты. Они собирают популярные треки по жанру или части мероприятия и исключают музыку, которую пользователь уже слышал. Например, плейлист может предложить десять популярных треков для праймтайма или афтерпати, которые пользователь ещё не знает.",
      },
    },
    {
      entryId: "jestei-02-source-04-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: "Полностью переделали сценарий покупки подписки. Объяснили разницу между тарифами и обозначили предложения для разных сегментов своими цветами.",
      },
    },
  ],
} as const satisfies MediaGroupData<MediaEntryId>;

export const jesteiSubscriptionBeforeAfter = {
  captionView: "summary",
  before: {
    entryId: "jestei-06-source-01-16x9-use-01",
    loading: "lazy",
    label: "До",
  },
  after: {
    entryId: "jestei-06-source-02-16x9-use-01",
    loading: "lazy",
    label: "После",
  },
  caption: {
    index: 23,
    title: "Новый дизайн тарифов.",
    text: "Полностью переделали сценарий покупки подписки, объяснили разницу между тарифами и разделили предложения для разных сегментов с помощью цветовых профилей.",
  },
  value: 50,
  min: 0,
  max: 100,
  step: 0.1,
  ariaLabel: "Сравнить изображение до и после",
} as const satisfies BeforeAfterData<MediaEntryId>;
