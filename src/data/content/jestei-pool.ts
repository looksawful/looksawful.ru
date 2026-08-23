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
export const jesteiHomeIntro = { title: "Главная страница", paragraphs: ["На главной странице сервиса пользователям показываются баннеры о свежих обновлениях контента. Мы полностью перестроили процесс создания баннеров, внедрили нейросети для генерации изображений вместо использования фотографий со стоков, переработали адаптивность компонента, сократив количество разрабатываемых баннеров для каждой рубрики с пяти до двух, перешли к таргетированному показу баннеров, подходящих конкретному пользователю — например, мы перестали показывать все баннеры об обновлениях в ивент-разделе клубным диджеям, которые не заходят в раздел ивент и не пытаются взаимодействовать с ним, и разработали концепции для рубрик, благодаря чему креативы стали последовательными и узнаваемыми."] } as const satisfies SectionIntroData;
export const jesteiHomeMockup = { entryId: "jestei-02-source-01-16x10-use-01", device: "desktop", role: "wide", captionView: "summary", loading: "eager" } as const satisfies MockupData<MediaEntryId>;
export const jesteiBrandIntro = { title: "Айдентика / бренд-система", bodyClassName: "brand-system__intro", paragraphs: ["Мы разделили аудиторию на три группы: клубных диджеев, ивент-диджеев и саунд-продюсеров. Это позволило точнее собирать продуктовые предложения, навигацию и коммуникацию под разные сценарии работы с сервисом."] } as const satisfies SectionIntroData;
export const jesteiInterfaceIntro = { title: "Интерфейс Jestei Pool", bodyClassName: "jestei-section-copy-list", paragraphs: ["Мы начали группировать плейлисты и сопровождать их описаниями и заголовками, наняли редактора и вместе с ним и диджеями, которые создают плейлисты, описали более 200 плейлистов на сайте, рассказали о каждом из жанров и собрали для каждой группы плейлистов свой визуальный код, вместо того чтобы использовать однообразные стоковые картинки для их обложек.", "Мы разработали алгоритмические плейлисты, которые автоматически собирают самые популярные треки по жанру или части мероприятия, которые пользователь ещё не слышал. Например, 10 незнакомых, но популярных треков для праймтайма или афтерпати.", "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей."] } as const satisfies SectionIntroData;
export const jesteiEditorialIntro = { title: "Редполитика", paragraphs: ["Собрали единые правила для tone of voice, терминологии, UX-writing, интерфейсных текстов и редакционной работы Jestei Pool."] } as const satisfies SectionIntroData;
export const jesteiRedpolitikaMockup = { entryId: "jestei-redpolitika-preview-use-01", device: "desktop", role: "wide", captionView: "lightbox-only", loading: "lazy", mediaClassName: "fit-cover" } as const satisfies MockupData<MediaEntryId>;
export const jesteiEventIntro = { title: "Event / лендинги / подборки", bodyClassName: "jestei-section-copy-list", paragraphs: ["Для лендинга мы начали активно использовать canvas-анимации и интерактивные виджеты. В лендинге мы стали показывать ленту с подборками треков, сразу знакомящую пользователя с интерфейсом и инструментами сервиса, показали плейлисты и рассказали о музыкальных жанрах, которые представлены на сервисе. Для анимированных секций лендинга для клубных диджеев мы использовали мою библиотеку анимаций Moves Awful.", "Ивент-диджеинг построен на сезонности, поэтому можно предсказать, какие коллекции плейлистов востребованы в данный момент. Мы провели исследование и выяснили, какие плейлисты наиболее востребованы у ивент-диджеев, перестроили навигацию в новом разделе, разделили сезонную музыку и музыку, которая нужна всегда, и выстроили порядок плейлистов так, чтобы самое главное всегда было под рукой.", "Мы создали виджеты с предложениями апгрейда подписки, чтобы стимулировать пользователя приобрести подписку следующего уровня.", "Мы изменили подход к группировке плейлистов и визуально разделили плейлисты и коллекции плейлистов, добавили подсказки и описания к группам плейлистов и перешли от использования стоковых картинок в обложках к дизайнерским обложкам."] } as const satisfies SectionIntroData;

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

export const jesteiLandingsIntro = { title: "Лендинги", paragraphs: ["К 2025 году один общий лендинг уже не отражал устройство сервиса: появилось много новых инструментов,сценариев и была занята новая ниша — мы начали работать с музыкой для ивент-диджеев. Мы начали активно работать с таргетированный рекламой и единый лендинг перестал эффективно работать как рекламный инструмент: он не описывал всю продуктовую линейку сервиса и не позволял делать точечные рекламные предложения. Поэтому мы запустили систему из двух лендингов,каждый из которых состоит из набора промомодулей, каждый из которых решал свою рекламную цель."] } as const satisfies SectionIntroData;
export const jesteiLandingsMockup = { entryId: "jestei-13-source-13-1280x588-use-01", device: "desktop", captionView: "summary", video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" } } as const satisfies MockupData<MediaEntryId>;
export const jesteiPromoIntro = { title: "Промокоммуникация", paragraphs: ["Для плейлистов, регулярных рубрик и сезонных подборок мы отказались от однообразного стокового контента и собрали собственный визуальный язык: использовали устойчивые метафоры, коллажи, иллюстрации, нейросети и отдельные стилистические решения для разных сценариев."] } as const satisfies SectionIntroData;


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
        text: "Мы сохранили узнаваемый шильд Jestei Pool, но заново описали его геометрию и правила построения, чтобы знак одинаково стабильно работал в интерфейсе, айдентике и промоматериалах.",
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
        text: "Цвет перестал быть декоративным акцентом и стал частью продуктовой навигации: для разных направлений сервиса мы собрали отдельные цветовые профили и зафиксировали их в общей палитре бренда.",
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
        text: "Мы описали структуру полной и сокращённой версий логотипа, соотношение знака и шрифтовой части и правила их использования, чтобы логотип можно было последовательно применять в разных форматах.",
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
        text: "Логотип встроили в дизайн-систему и связали с типографикой, цветами и интерфейсными правилами, чтобы айдентика не существовала отдельно от продукта, а работала внутри него как часть одной системы.",
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
        text: "В качестве акцидентного шрифта бренда мы добавили Druk Wide и использовали его в крупных заголовках и промокоммуникации, сохранив основной интерфейсный шрифт для функционального текста.",
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
        text: "Мы разделили аудиторию на три группы: клубных диджеев, ивент-диджеев и саунд-продюсеров. Это позволило точнее собирать продуктовые предложения, навигацию и коммуникацию под разные сценарии работы с сервисом.",
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
        text: "Мы начали группировать плейлисты и сопровождать их описаниями и заголовками, наняли редактора и вместе с ним и диджеями, которые создают плейлисты, описали более 200 плейлистов на сайте, рассказали о каждом из жанров и собрали для каждой группы плейлистов свой визуальный код, вместо того чтобы использовать однообразные стоковые картинки для их обложек.",
      },
    },
    {
      entryId: "jestei-02-source-03-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: "Мы разработали алгоритмические плейлисты, которые автоматически собирают самые популярные треки по жанру или части мероприятия, которые пользователь ещё не слышал. Например, 10 незнакомых, но популярных треков для праймтайма или афтерпати.",
      },
    },
    {
      entryId: "jestei-02-source-04-16x10-use-01",
      loading: "lazy",
      className: "jestei-captioned-media",
      captionFields: ["index", "title"],
      surfaceOverlay: {
        className: "jestei-media__hover-copy",
        text: "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей.",
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
    text: "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей.",
  },
  value: 50,
  min: 0,
  max: 100,
  step: 0.1,
  ariaLabel: "Сравнить изображение до и после",
} as const satisfies BeforeAfterData<MediaEntryId>;
