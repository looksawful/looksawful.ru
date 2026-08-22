import type { MediaEntryData } from "../../../types/media.ts";
import type { ProjectId } from "../../catalog/projects/index.ts";
import type { MediaAssetId } from "../assets/index.ts";
import type { MediaCreditsId } from "../credits.ts";

export const jesteiMediaEntries = [
  {
    id: "jestei-01-source-01-823x419-use-01",
    assetId: "jestei-01-source-01-823x419",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Креатив для ежемесячной рубрики «Лучшие треки месяца».",
      index: 1,
      text: "В 2025 году одной из задач было привлечь молодых диджеев и изменить их отношение к сервису. Поэтому мы омолодили визуальные образы диджеев в коммуникации и стали активнее добавлять музыку, популярную у аудитории 18–30 лет.",
    },
    purpose: "work",
  },
  {
    id: "jestei-01-source-02-55x28-use-01",
    assetId: "jestei-01-source-02-55x28",
    projectIds: ["jestei-landings", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Скриншот секции лендинга для клубных диджеев.",
      text: "К 2025 году один общий лендинг уже не отражал устройство сервиса: появилось много новых инструментов, сценариев, и была занята новая ниша — мы начали работать с музыкой для ивент-диджеев. Мы начали активно работать с таргетированной рекламой, и единый лендинг перестал эффективно работать как рекламный инструмент: он не описывал всю продуктовую линейку сервиса и не позволял делать точечные рекламные предложения. Поэтому мы запустили систему из двух лендингов, каждый из которых состоит из набора промомодулей, решающих свои рекламные задачи.",
    },
    purpose: "work",
  },
  {
    id: "jestei-02-source-01-16x10-use-01",
    assetId: "jestei-02-source-01-16x10",
    projectIds: ["jestei-core-interface", "jestei-event", "jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Главная страница Jestei Pool.",
      index: 2,
      text: "На главной странице сервиса пользователям показываются баннеры о свежих обновлениях контента. Мы полностью перестроили процесс создания баннеров, внедрили нейросети для генерации изображений вместо использования фотографий со стоков, переработали адаптивность компонента, сократив количество разрабатываемых баннеров для каждой рубрики с пяти до двух, перешли к таргетированному показу баннеров, подходящих конкретному пользователю — например, мы перестали показывать все баннеры об обновлениях в ивент-разделе клубным диджеям, которые не заходят в раздел ивент и не пытаются взаимодействовать с ним, и разработали концепции для рубрик, благодаря чему креативы стали последовательными и узнаваемыми.",
    },
    purpose: "work",
  },
  {
    id: "jestei-02-source-02-16x10-use-01",
    assetId: "jestei-02-source-02-16x10",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Страница с подборкой плейлистов Jestei Pool.",
      index: 9,
      text: "Мы начали группировать плейлисты и сопровождать их описаниями и заголвоками, наняли редактора и вместе с ним и диджеями,котоыре создают плейлисты описали более 200 плейлистов на сайте,рассказали о каждом из жэанров и собрали для каждой группы плейлистов свой визуальный код, вместо того чтобы использовать однообразные стоковые картинки для их обложек.",
    },
    purpose: "work",
  },
  {
    id: "jestei-02-source-03-16x10-use-01",
    assetId: "jestei-02-source-03-16x10",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Страница динамического плейлиста с лентой треков.",
      index: 10,
      text: "Мы разработали алгоритмические плейлисты, которые автоматически собирают самые популярные треки по жанру или части мероприятия, которые пользователь ещё не слышал. Например, 10 незнакомых, но популярных треков для праймтайма или афтерпати.",
    },
    purpose: "work",
  },
  {
    id: "jestei-02-source-04-16x10-use-01",
    assetId: "jestei-02-source-04-16x10",
    projectIds: ["jestei-subscription"],
    alt: "",
    caption: {
      title: "Промосекция с тарифами.",
      index: 11,
      text: "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей.",
    },
    purpose: "work",
  },
  {
    id: "jestei-03-source-01-16x9-use-01",
    assetId: "jestei-03-source-01-16x9",
    projectIds: ["jestei-event", "jestei-playlist-system", "jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Бенто-грид «Главное в Event».",
      index: 12,
      text: "Ивент-диджеинг построен на сезонности, поэтому можно предсказать, какие коллекции плейлистов востребованы в данный момент. Мы провели исследование и выяснили, какие плейлисты наиболее востребованы у ивент-диджеев, перестроили навигацию в новом разделе, разделили сезонную музыку и музыку, которая нужна всегда, и выстроили порядок плейлистов так, чтобы самое главное всегда было под рукой.",
    },
    purpose: "work",
  },
  {
    id: "jestei-03-source-02-16x9-use-01",
    assetId: "jestei-03-source-02-16x9",
    projectIds: ["jestei-landings", "jestei-playlist-system"],
    caption: {
      title: "Анимированная секция лендинга для клубных диджеев.",
      text: "Для лендинга мы начали активно использовать canvas-анимации и интерактивные виджеты. В лендинге мы стали показывать ленту с подборками треков, сразу знакомящую пользователя с интерфейсом и инструментами сервиса, показали плейлисты и рассказали о музыкальных жанрах, которые представлены на сервисе. Для анимированных секций лендинга для клубных диджеев мы использовали мою библиотеку анимаций Moves Awful.",
    },
    purpose: "work",
  },
  {
    id: "jestei-03-source-03-16x9-use-01",
    assetId: "jestei-03-source-03-16x9",
    projectIds: ["jestei-subscription"],
    alt: "",
    caption: {
      title: "Промовиджет апгрейда тарифа.",
      index: 13,
      text: "Мы создали виджеты с предложениями апгрейда подписки, чтобы стимулировать пользователя приобрести подписку следующего уровня.",
    },
    purpose: "work",
  },
  {
    id: "jestei-03-source-04-16x9-use-01",
    assetId: "jestei-03-source-04-16x9",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Подборки плейлистов и коллекций.",
      index: 14,
      text: "Мы изменили подход к группировке плейлистов и визуально разделили плейлисты и коллекции плейлистов, добавили подсказки и описания к группам плейлистов и перешли от использования стоковых картинок в обложках к дизайнерским обложкам.",
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-01-9x16-use-01",
    assetId: "jestei-04-source-01-9x16",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 15,
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-02-9x16-use-01",
    assetId: "jestei-04-source-02-9x16",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 16,
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-03-9x16-use-01",
    assetId: "jestei-04-source-03-9x16",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 17,
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-04-323x623-use-01",
    assetId: "jestei-04-source-04-323x623",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 18,
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-05-323x623-use-01",
    assetId: "jestei-04-source-05-323x623",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 19,
    },
    purpose: "work",
  },
  {
    id: "jestei-04-source-06-323x623-use-01",
    assetId: "jestei-04-source-06-323x623",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Интерактивный плеер для инстаграм-постов.",
      index: 20,
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-03-1681x1938-use-01",
    assetId: "jestei-08-source-03-1681x1938",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Шапки для авторских плейлистов от эксклюзивных эдиторов сайта.",
      text: "Мы начали активно использовать яркие цвета и геометрические формы для декорирования авторских плейлистов, постов с музыкой в соцсетях и страниц постоянных партнёров сайта.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-04-697x644-use-01",
    assetId: "jestei-08-source-04-697x644",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Креативы для постов, обложек и сторис в соцсетях с эксклюзивными эдитами, гест-треками и авторскими плейлистами.",
      text: "Jestei Pool активно работает с диджеями, которые пишут музыку и собирают паки и плейлисты, доступные только пользователям сервиса. Мы активно использовали геометрические формы и яркие цвета, чтобы привлечь внимание к таким релизам.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-01-701x452-use-01",
    assetId: "jestei-05-source-01-701x452",
    projectIds: ["jestei-promo-communication", "jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Ежемесячный баннер об обновлении плейлиста Censored.",
      index: 24,
      text: "Для регулярных рубрик мы подбирали общий набор метафор и идей.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-02-1x1-use-01",
    assetId: "jestei-05-source-02-1x1",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Обложка плейлиста с советской электроникой.",
      index: 25,
      text: "Мы перешли от использования сырого стокового контента к созданию собственного дизайна для каждой обложки.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-03-1x1-use-01",
    assetId: "jestei-05-source-03-1x1",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Обложка плейлиста техно.",
      index: 26,
      text: "Для некоторых плейлистов мы создавали минималистичные обложки.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-04-1x1-use-01",
    assetId: "jestei-05-source-04-1x1",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Обложка обновляемого плейлиста «Цензура» с треками без мата.",
      index: 27,
      text: "Для регулярно обновляемых плейлистов мы придумывали метафоры, вокруг которых выстраивали дизайн. Благодаря этому рубрика оставалась узнаваемой, но обложки всегда выглядели свежими.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-05-1x1-use-01",
    assetId: "jestei-05-source-05-1x1",
    projectIds: ["jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Обложка регулярно обновляемого кураторского плейлиста Russian Transition с треками без мата.",
      index: 28,
      text: "Диджеи редко проводят профессиональные съёмки, и, чтобы обложки всегда выглядели бодрыми и яркими, мы использовали нейросети, геометрические паттерны и быстро реализуемые приёмы для обработки и декорирования обложек.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-06-1x1-use-01",
    assetId: "jestei-05-source-06-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    alt: "",
    caption: {
      title: "Обложка коллекции треков-отбивок для ивент-диджеев.",
      index: 29,
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-07-1x1-use-01",
    assetId: "jestei-05-source-07-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    alt: "",
    caption: {
      title: "Обложка для коллекции плейлистов с треками для спортивных мероприятий.",
      index: 30,
      text: "Для коллекций мы стали использовать коллажи, чтобы подчеркнуть вложенность. Например, в коллекции «Спорт» — плейлисты про хоккей, футбол и бокс, поэтому в коллаже появились клюшка, футбольные ворота и боксёрские перчатки.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-08-1x1-use-01",
    assetId: "jestei-05-source-08-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    alt: "",
    caption: {
      title: "Обложка плейлиста для ивент-диджеев к 1 сентября.",
      index: 31,
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-09-1x1-use-01",
    assetId: "jestei-05-source-09-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    alt: "",
    caption: {
      title: "Обложка для новогоднего плейлиста «Русская эстрада» для ивент-диджеев.",
      index: 32,
      text: "Для сезонных коллекций плейлистов мы стали разрабатывать отдельные цветовые и стилистические решения. Например, вся серия новогодних обложек для ивента строилась вокруг странных советских ёлочных игрушек.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-10-1x1-use-01",
    assetId: "jestei-05-source-10-1x1",
    projectIds: ["jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Обложка для поста с советами о том, как диджею готовиться к саундчеку.",
      index: 33,
      text: "После ребрендинга мы начали рисовать небрежные иллюстрации и использовать метафоры, чтобы привлекать внимание и выстраивать эмоциональную связь с подписчиками.",
    },
    purpose: "work",
  },
  {
    id: "jestei-05-source-11-3x2-use-01",
    assetId: "jestei-05-source-11-3x2",
    projectIds: ["jestei-promo-communication", "jestei-playlist-system"],
    alt: "",
    caption: {
      title: "Баннер об обновлении регулярной рубрики «Эксклюзивные эдиты».",
      index: 34,
    },
    purpose: "work",
  },
  {
    id: "jestei-06-source-01-16x9-use-01",
    assetId: "jestei-06-source-01-16x9",
    projectIds: ["jestei-subscription"],
    alt: "Изображение до изменений",
    caption: {
      title: "Новый дизайн тарифов.",
      index: 23,
      text: "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей.",
    },
    purpose: "work",
  },
  {
    id: "jestei-06-source-02-16x9-use-01",
    assetId: "jestei-06-source-02-16x9",
    projectIds: ["jestei-subscription"],
    alt: "Изображение после изменений",
    caption: {
      title: "Новый дизайн тарифов.",
      index: 23,
      text: "Мы полностью переделали сценарий покупки подписки, описали разницу между тарифами, разделили тарифы для разных сегментов при помощи цветовых профилей.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-01-51x32-use-01",
    assetId: "jestei-08-source-01-51x32",
    projectIds: ["jestei-subscription"],
    caption: {
      title: "Система виджетов для апгрейда.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-02-6383x2862-use-01",
    assetId: "jestei-08-source-02-6383x2862",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Мы стали активно использовать объёмные текстурные тексты для заголовков.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-06-224x99-use-01",
    assetId: "jestei-08-source-06-224x99",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Карточки для плейлиста Jestei Edits.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-10-673x420-use-01",
    assetId: "jestei-08-source-10-673x420",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "Хиро-секция лендинга для ивент-диджеев.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-07-449x240-use-01",
    assetId: "jestei-08-source-07-449x240",
    projectIds: ["jestei-landings"],
    caption: {
      title: "Одна из промостраниц для клубных диджеев.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-08-85x112-use-01",
    assetId: "jestei-08-source-08-85x112",
    projectIds: ["jestei-subscription", "jestei-landings", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Подробные виджеты с тарифами.",
      text: "При регистрации пользователю, о котором мы ничего не знаем, предлагается любой тариф на выбор. Но для пользователей, которые приходят с таргетированной рекламы или по программе апгрейда, мы разработали отдельные виджеты и интерфейс подключения подписки. Пользователю, который хочет сделать апгрейд подписки или регистрируется через лендинг ивента, сначала предлагается подписка, решающая его задачу, вместо всех подписок сразу.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-05-407x425-use-01",
    assetId: "jestei-08-source-05-407x425",
    projectIds: ["jestei-track-filter", "jestei-event"],
    caption: {
      title: "Фильтр треков для ивент-диджеев.",
      text: "В 2026 году мы запустили для ивент-диджеев собственную ленту треков с полностью перестроенной системой поиска и фильтрации музыки.",
    },
    purpose: "work",
  },
  {
    id: "jestei-08-source-11-637x419-use-01",
    assetId: "jestei-08-source-11-637x419",
    projectIds: ["jestei-brand-system", "jestei-track-filter"],
    caption: {
      title: "Новый интерфейс для выбора тональности при помощи колеса Камелота.",
      text: "Мы перестроили дизайн системы выбора тональности на основе кварто-квинтового круга, расположив минорные тональности во внутреннем кольце, а мажорные — во внешнем. Инструмент имеет две версии на выбор: диджейскую систему Камелота с цифрами и буквами для обозначения тональностей и классическую германскую буквенную систему для музыкантов, знающих музыкальную теорию.",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-05-62x59-use-01",
    assetId: "jestei-09-source-05-62x59",
    projectIds: ["jestei-track-filter", "jestei-event", "jestei-core-interface"],
    caption: {
      title: "Фрагмент ui-kit с chips для ивент-версии фильтра треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-06-426x583-use-01",
    assetId: "jestei-09-source-06-426x583",
    purpose: "work",
  },
  {
    id: "jestei-09-source-10-1x1-use-01",
    assetId: "jestei-09-source-10-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "шаблон макета поста о выходе гест-трека от нового партнера сервиса",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-11-1x1-use-01",
    assetId: "jestei-09-source-11-1x1",
    projectIds: ["jestei-promo-communication", "jestei-playlist-system"],
    caption: {
      title: "3д леттеринг для подборки треков доступных только на джести пул",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-12-1x1-use-01",
    assetId: "jestei-09-source-12-1x1",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Маскот для креативов сезона \"А-ля Рус\" в ивенте 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-13-1x1-use-01",
    assetId: "jestei-09-source-13-1x1",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Расслабленное оформление текстовых постов в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-15-1x1-use-01",
    assetId: "jestei-09-source-15-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для плейлиста \"свадебное караоке\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-17-2x1-use-01",
    assetId: "jestei-09-source-17-2x1",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Баннер об открытии сезона \"А-ля Рус\"в ивенте 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-19-358x359-use-01",
    assetId: "jestei-09-source-19-358x359",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для подборки от Nikita Rise",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-21-1x1-use-01",
    assetId: "jestei-09-source-21-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для плейлиста Юбилей — 30 лет",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-22-179x180-use-01",
    assetId: "jestei-09-source-22-179x180",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Облокжа для плейлиста \"Бизнес\" 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-23-638x637-use-01",
    assetId: "jestei-09-source-23-638x637",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для новогоднего авторского плейлиста 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-25-1x1-use-01",
    assetId: "jestei-09-source-25-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста с треками на день рождения",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-26-275x249-use-01",
    assetId: "jestei-09-source-26-275x249",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста с музыкой для детей",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-29-1x1-use-01",
    assetId: "jestei-09-source-29-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Баннер о выходе подборки самых популярных треков на jesteipool за месяц 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-32-1027x1531-use-01",
    assetId: "jestei-09-source-32-1027x1531",
    purpose: "work",
  },
  {
    id: "jestei-09-source-34-269x157-use-01",
    assetId: "jestei-09-source-34-269x157",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Баннер о выходе подборки самых популярных треков доступных только на jesteipool за месяц 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-36-1x1-use-01",
    assetId: "jestei-09-source-36-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста Цензура 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-42-1x1-use-01",
    assetId: "jestei-09-source-42-1x1",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Обложка регулярного эксклюбзив эдита от Bass King 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-43-1x1-use-01",
    assetId: "jestei-09-source-43-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка плейлиста фоны для сезона \"А-ля Рус\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-44-1x1-use-01",
    assetId: "jestei-09-source-44-1x1",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "3д версия логотипа",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-45-1x1-use-01",
    assetId: "jestei-09-source-45-1x1",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "3д версия логотипа",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-46-1x1-use-01",
    assetId: "jestei-09-source-46-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для сезонного свадебного плейлиста \"Свадебный Банкет\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-47-1x1-use-01",
    assetId: "jestei-09-source-47-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Облокжа для плейлиста \"Конференция\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-48-89x40-use-01",
    assetId: "jestei-09-source-48-89x40",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-49-89x40-use-01",
    assetId: "jestei-09-source-49-89x40",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-50-1x1-use-01",
    assetId: "jestei-09-source-50-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для сезонного свадебного плейлиста \"Объявляем вас...\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-51-1x1-use-01",
    assetId: "jestei-09-source-51-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для сезонного плейлиста на Хеллоуин 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-52-89x40-use-01",
    assetId: "jestei-09-source-52-89x40",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-53-1x1-use-01",
    assetId: "jestei-09-source-53-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для сезонного свадебного плейлиста \"Дискотека\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-54-1x1-use-01",
    assetId: "jestei-09-source-54-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для сезонного свадебного плейлиста \"Фейерверк\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-55-1x1-use-01",
    assetId: "jestei-09-source-55-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для сезонного свадебного плейлиста \"Свадебная вечеринка\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-56-229x121-use-01",
    assetId: "jestei-09-source-56-229x121",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-57-229x121-use-01",
    assetId: "jestei-09-source-57-229x121",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-58-229x121-use-01",
    assetId: "jestei-09-source-58-229x121",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-59-229x121-use-01",
    assetId: "jestei-09-source-59-229x121",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-60-229x121-use-01",
    assetId: "jestei-09-source-60-229x121",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для динамического плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-61-1x1-use-01",
    assetId: "jestei-09-source-61-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Слайд статьи о диджеинге",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-62-538x359-use-01",
    assetId: "jestei-09-source-62-538x359",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Креатив для рекламной кампании дял клубных диджеев",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-63-142x239-use-01",
    assetId: "jestei-09-source-63-142x239",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Креатив для рекламной кампании об открытии свадебного сезона в ивенте 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-64-358x359-use-01",
    assetId: "jestei-09-source-64-358x359",
    purpose: "work",
  },
  {
    id: "jestei-09-source-65-1x1-use-01",
    assetId: "jestei-09-source-65-1x1",
    purpose: "work",
  },
  {
    id: "jestei-09-source-66-1x1-use-01",
    assetId: "jestei-09-source-66-1x1",
    purpose: "work",
  },
  {
    id: "jestei-09-source-67-1x1-use-01",
    assetId: "jestei-09-source-67-1x1",
    purpose: "work",
  },
  {
    id: "jestei-09-source-68-1x1-use-01",
    assetId: "jestei-09-source-68-1x1",
    purpose: "work",
  },
  {
    id: "jestei-09-source-69-13x19-use-01",
    assetId: "jestei-09-source-69-13x19",
    purpose: "work",
  },
  {
    id: "jestei-09-source-70-245x122-use-01",
    assetId: "jestei-09-source-70-245x122",
    projectIds: ["jestei-landings", "jestei-promo-communication"],
    caption: {
      title: "Промомодуль отдельной страницы для треков на которые отправлялась реклама",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-71-479x244-use-01",
    assetId: "jestei-09-source-71-479x244",
    projectIds: ["jestei-landings", "jestei-playlist-system", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Промомодуль лендинга о плейлистах для спортивных мероприятий для таргетированной рекламы",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-72-481x244-use-01",
    assetId: "jestei-09-source-72-481x244",
    projectIds: ["jestei-landings", "jestei-playlist-system", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Промомодуль лендинга о плейлистах для свадебной церемонии для таргетированной рекламы",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-73-120x61-use-01",
    assetId: "jestei-09-source-73-120x61",
    projectIds: ["jestei-landings", "jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Промомодуль лендинга о плейлистах для дестких праздников для таргетированной рекламы",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-75-325x244-use-01",
    assetId: "jestei-09-source-75-325x244",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "Фрагмент лендинга для крлубных ивентов о жанрах доступных на сайте",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-77-262x347-use-01",
    assetId: "jestei-09-source-77-262x347",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "Фрагмент макетов для лендинга ивента",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-78-265x84-use-01",
    assetId: "jestei-09-source-78-265x84",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Карточки коллекции \"Свадьбы\" в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-79-535x84-use-01",
    assetId: "jestei-09-source-79-535x84",
    projectIds: ["jestei-event"],
    caption: {
      title: "Карточки колелкций плейлитосв в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-80-34x29-use-01",
    assetId: "jestei-09-source-80-34x29",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Макет модалки \"Что нового?\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-81-8x5-use-01",
    assetId: "jestei-09-source-81-8x5",
    projectIds: ["jestei-landings", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Промомодуль лендинга о начале свадебного сезона для таргетированной рекламы",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-82-187x140-use-01",
    assetId: "jestei-09-source-82-187x140",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Десктопная версия аккордеона с Часто задаваемыми вопросами",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-83-171x107-use-01",
    assetId: "jestei-09-source-83-171x107",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "фрагмент ui-kit с лентой миксов",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-84-4x3-use-01",
    assetId: "jestei-09-source-84-4x3",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "фрагмент ui-kit с выпадающими меню",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-85-997x624-use-01",
    assetId: "jestei-09-source-85-997x624",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Скриншотадесктопной версии интерфейса ленты новинок",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-86-1x1-use-01",
    assetId: "jestei-09-source-86-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-87-1x1-use-01",
    assetId: "jestei-09-source-87-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-88-1x1-use-01",
    assetId: "jestei-09-source-88-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-89-1x1-use-01",
    assetId: "jestei-09-source-89-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-90-1423x1422-use-01",
    assetId: "jestei-09-source-90-1423x1422",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-91-1460x1369-use-01",
    assetId: "jestei-09-source-91-1460x1369",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "3д версия логотипа",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-93-1x1-use-01",
    assetId: "jestei-09-source-93-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-94-124x99-use-01",
    assetId: "jestei-09-source-94-124x99",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Иконки для сайдбара",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-95-121x325-use-01",
    assetId: "jestei-09-source-95-121x325",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Компонент сайдбара для десктопа на страницу с клубными продуктами",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-97-121x325-use-01",
    assetId: "jestei-09-source-97-121x325",
    projectIds: ["jestei-event", "jestei-core-interface"],
    caption: {
      title: "Компонент сайдбара для десктопа на страницу с ивент продуктами",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-98-41x409-use-01",
    assetId: "jestei-09-source-98-41x409",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Компонент сайдбара для мобильного устройства",
    },
    purpose: "work",
  },
  {
    id: "jestei-09-source-99-11x78-use-01",
    assetId: "jestei-09-source-99-11x78",
    projectIds: ["jestei-subscription"],
    caption: {
      title: "Варианты виджетов для апгрейда подписки",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-11-png-icon-only-icon-only-bright-use-01",
    assetId: "jestei-logo-source-11-png-icon-only-icon-only-bright",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Эмблема, выворотка",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-12-png-icon-only-icon-only-dark-use-01",
    assetId: "jestei-logo-source-12-png-icon-only-icon-only-dark",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Эмблема,  контраст",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-13-png-icon-only-icon-only-orange-use-01",
    assetId: "jestei-logo-source-13-png-icon-only-icon-only-orange",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Эмблема, клуб",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-14-png-icon-only-logo-event-shield-only-use-01",
    assetId: "jestei-logo-source-14-png-icon-only-logo-event-shield-only",
    projectIds: ["jestei-brand-system", "jestei-event"],
    caption: {
      title: "Эмблема, ивент",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-21-svg-full-text-icon-full-split-use-01",
    assetId: "jestei-logo-source-21-svg-full-text-icon-full-split",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Символ бренда, клубаня версия",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-25-svg-jestei-event-full-event-use-01",
    assetId: "jestei-logo-source-25-svg-jestei-event-full-event",
    projectIds: ["jestei-brand-system", "jestei-event"],
    caption: {
      title: "Полная версия логотипа, версия для ивента",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-26-svg-jestei-event-full-split-use-01",
    assetId: "jestei-logo-source-26-svg-jestei-event-full-split",
    projectIds: ["jestei-brand-system", "jestei-event"],
    caption: {
      title: "Символ бренда,версия для ивента",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-28-svg-jestei-event-text-logo-event-use-01",
    assetId: "jestei-logo-source-28-svg-jestei-event-text-logo-event",
    projectIds: ["jestei-brand-system", "jestei-event"],
    caption: {
      title: "Шрифтовая версия логотипа, версия для ивента",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-29-svg-text-only-text-logo-bright-use-01",
    assetId: "jestei-logo-source-29-svg-text-only-text-logo-bright",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Шрифтовая версия логотипа, светлая версия",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-30-svg-text-only-text-logo-dark-use-01",
    assetId: "jestei-logo-source-30-svg-text-only-text-logo-dark",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Шрифтовая версия логотипа, контрастная версия",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-31-svg-text-only-text-logo-orange-use-01",
    assetId: "jestei-logo-source-31-svg-text-only-text-logo-orange",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Шрифтовая версия логотипа, клубная версия",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-34-logo-jestei-pool-3-use-01",
    assetId: "jestei-logo-source-34-logo-jestei-pool-3",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Полная версия логотипа, клубная версия",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-35-jestei-logo-depth-reference-use-01",
    assetId: "jestei-logo-source-35-jestei-logo-depth-reference",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Варианты логотипа в объеме",
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-anatomy-slide-use-01",
    assetId: "jestei-system-logo-source-logo-anatomy-slide",
    projectIds: ["jestei-brand-system", "jestei-promo-communication"],
    alt: "",
    caption: {
      title: "Подробная схема построения шильда",
      index: 3,
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-color-slide-use-01",
    assetId: "jestei-system-logo-source-logo-color-slide",
    projectIds: ["jestei-brand-system"],
    alt: "",
    caption: {
      title: "Обновленная цветовая палитра бренда",
      index: 4,
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-wordmark-stack-use-01",
    assetId: "jestei-system-logo-source-logo-wordmark-stack",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Вароинаты логотипа в полном виде",
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-type-slide-use-01",
    assetId: "jestei-system-logo-source-logo-type-slide",
    projectIds: ["jestei-brand-system"],
    alt: "",
    caption: {
      title: "Подробная схема о структуре логотипа",
      index: 5,
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-shirt-use-01",
    assetId: "jestei-system-logo-source-logo-shirt",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Мокап с логотоипом и на футболке",
    },
    purpose: "work",
  },
  {
    id: "jestei-system-logo-source-logo-system-01-use-01",
    assetId: "jestei-system-logo-source-logo-system-01",
    projectIds: ["jestei-brand-system"],
    alt: "",
    caption: {
      title: "Фрагмент дизайн системы с логотипом",
      index: 6,
    },
    purpose: "work",
  },
  {
    id: "jestei-system-type-source-logo-druk-slide-use-01",
    assetId: "jestei-system-type-source-logo-druk-slide",
    projectIds: ["jestei-brand-system"],
    alt: "",
    caption: {
      title: "Новый акцидентный шрифт бренда — Druk Wide",
      index: 7,
    },
    purpose: "work",
  },
  {
    id: "jestei-system-editorial-source-jestei-product-canvas-161-use-01",
    assetId: "jestei-system-editorial-source-jestei-product-canvas-161",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Фрагмент дизайна рассылок",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-01-3963x2650-use-01",
    assetId: "jestei-10-source-01-3963x2650",
    projectIds: ["jestei-playlist-system", "jestei-core-interface"],
    caption: {
      title: "скриншот тз ui-kit с макетами новой страницы Record Pool",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-02-640x221-use-01",
    assetId: "jestei-10-source-02-640x221",
    projectIds: ["jestei-playlist-system", "jestei-core-interface"],
    caption: {
      title: "скриншот тз ui-kit с макетами новой страницы Exclusives",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-05-448x337-use-01",
    assetId: "jestei-10-source-05-448x337",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "Интерактивная промосекция лендинга ивента для таргета",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-06-487x244-use-01",
    assetId: "jestei-10-source-06-487x244",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "Интерактивная промосекция лендинга ивента для таргета",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-07-305x191-use-01",
    assetId: "jestei-10-source-07-305x191",
    projectIds: ["jestei-subscription", "jestei-landings"],
    caption: {
      title: "Секция с тарифами в новом лендинге для клубных диджеев",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-08-590x443-use-01",
    assetId: "jestei-10-source-08-590x443",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "скриншот тз ui-kit с макетами нового сайдбара",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-09-449x337-use-01",
    assetId: "jestei-10-source-09-449x337",
    projectIds: ["jestei-track-filter", "jestei-core-interface"],
    caption: {
      title: "скриншот тз ui-kit с макетами фильтра треков",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-10-1x1-use-01",
    assetId: "jestei-10-source-10-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "обложка для баннера об ошибках на сайте",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-11-1x1-use-01",
    assetId: "jestei-10-source-11-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "обложка для хеллоуинского плейлиста 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-13-1x1-use-01",
    assetId: "jestei-10-source-13-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка плейлиста 14 феквраля 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-14-426x583-use-01",
    assetId: "jestei-10-source-14-426x583",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "креатив для соцсетей",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-15-1x1-use-01",
    assetId: "jestei-10-source-15-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста на 9 мая 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-16-223x286-use-01",
    assetId: "jestei-10-source-16-223x286",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "креатив для постов сзеона А-ля Рус",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-17-101x50-use-01",
    assetId: "jestei-10-source-17-101x50",
    projectIds: ["jestei-core-interface"],
    alt: "",
    caption: {
      title: "разделили аудиторию на три группы: \"клубные диджеи\", \"ивент диджеи\" и \"саунд-продюсеры\"",
      index: 8,
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-18-19x26-use-01",
    assetId: "jestei-10-source-18-19x26",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "обложка для свадебного плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-19-1x1-use-01",
    assetId: "jestei-10-source-19-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "обложка-коллаж для спортивных плейлистов",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-20-1x1-use-01",
    assetId: "jestei-10-source-20-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "креатив для рассылки",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-21-267x200-use-01",
    assetId: "jestei-10-source-21-267x200",
    projectIds: ["jestei-landings", "jestei-event"],
    caption: {
      title: "hero-image лендинга ивента",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-22-11x10-use-01",
    assetId: "jestei-10-source-22-11x10",
    projectIds: ["jestei-event"],
    caption: {
      title: "лента ивента в мобильном мокапе",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-23-329x342-use-01",
    assetId: "jestei-10-source-23-329x342",
    projectIds: ["jestei-event"],
    caption: {
      title: "Лента ивента в мокапе ноутубка",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-24-491x256-use-01",
    assetId: "jestei-10-source-24-491x256",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "лента миксов",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-25-608x311-use-01",
    assetId: "jestei-10-source-25-608x311",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "карточки с артистами",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-28-421x861-use-01",
    assetId: "jestei-10-source-28-421x861",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Мобильный мокап с интерфейсом ленты новинок",
    },
    purpose: "work",
  },
  {
    id: "jestei-10-source-29-720x289-use-01",
    assetId: "jestei-10-source-29-720x289",
    projectIds: ["jestei-landings"],
    caption: {
      title: "ФОновое изображение для лендинга",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-01-1x1-use-01",
    assetId: "jestei-11-source-01-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Креатив для соцсетей",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-02-1x1-use-01",
    assetId: "jestei-11-source-02-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для свадебного плейлиста с треками на вынос торта",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-03-1x1-use-01",
    assetId: "jestei-11-source-03-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка плейлиста на 8 марта 2025",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-04-1x1-use-01",
    assetId: "jestei-11-source-04-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка плелйиста \"Бал\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-05-1x1-use-01",
    assetId: "jestei-11-source-05-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка плейлиста \"Джаз\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-06-1x1-use-01",
    assetId: "jestei-11-source-06-1x1",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Креатив для плейлиста на 8 марта 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-07-644x800-use-01",
    assetId: "jestei-11-source-07-644x800",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка поста об обновлении февральской подборки Топ 50 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-08-1x1-use-01",
    assetId: "jestei-11-source-08-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка поста об обновлении сентябрьской подборки Топ 50 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-09-1x1-use-01",
    assetId: "jestei-11-source-09-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка материала о диджеях",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-10-1x1-use-01",
    assetId: "jestei-11-source-10-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Слайд поста об известных диджеях",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-11-4x5-use-01",
    assetId: "jestei-11-source-11-4x5",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Обложка для инстаграма об обткрытии свадебного сезона 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-12-4x5-use-01",
    assetId: "jestei-11-source-12-4x5",
    projectIds: ["jestei-playlist-system", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Слайд поста карусели для инстаграма об обновлении сезонных свадебных плейлистов в ивенте,плейлист \"Церемония\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-13-4x5-use-01",
    assetId: "jestei-11-source-13-4x5",
    projectIds: ["jestei-playlist-system", "jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Слайд поста карусели для инстаграма об обновлении сезонных свадебных плейлистов в ивенте,плейлист \"Банкет\" 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-14-1x1-use-01",
    assetId: "jestei-11-source-14-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка поста об открытой вакансии",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-15-1x1-use-01",
    assetId: "jestei-11-source-15-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка статьи о подходе диджеев к оформлению своих выступлений",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-16-1x1-use-01",
    assetId: "jestei-11-source-16-1x1",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Пост об обновлении в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-17-490x1280-use-01",
    assetId: "jestei-11-source-17-490x1280",
    projectIds: ["jestei-core-interface"],
    caption: {
      title: "Мобильная версия страницы с лентой треков \"Лента Новинок\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-18-423x1280-use-01",
    assetId: "jestei-11-source-18-423x1280",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Мобильная версия страницы плейлиста",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-19-4x3-use-01",
    assetId: "jestei-11-source-19-4x3",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Скриншот страницы Эксклюзивы после перевода сайта на русский язык",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-20-1x1-use-01",
    assetId: "jestei-11-source-20-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Вступительная секция дизайна рассылки для реанимации клиентов",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-21-1x1-use-01",
    assetId: "jestei-11-source-21-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Аутр, секция дизайна рассылки для реанимации клиентов",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-22-1x1-use-01",
    assetId: "jestei-11-source-22-1x1",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Обльожка для хеллоуинского пака Bass King 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-23-1x1-use-01",
    assetId: "jestei-11-source-23-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка для развлекательной рубрики \"что делать\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-24-1x1-use-01",
    assetId: "jestei-11-source-24-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка для развлекательной рубрики \"никогда не говори это диджею\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-25-1x1-use-01",
    assetId: "jestei-11-source-25-1x1",
    projectIds: ["jestei-playlist-system", "jestei-promo-communication"],
    caption: {
      title: "Обложка для хеллоуинского пака от команды, Mages 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-26-1x1-use-01",
    assetId: "jestei-11-source-26-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста \"Советский эмбиент\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-27-1x1-use-01",
    assetId: "jestei-11-source-27-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для плейлиста \"Подложки\"в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-28-1x1-use-01",
    assetId: "jestei-11-source-28-1x1",
    projectIds: ["jestei-playlist-system", "jestei-event"],
    caption: {
      title: "Обложка для плейлиста \"Подложки\"в ивенте",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-29-1x1-use-01",
    assetId: "jestei-11-source-29-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Обложка для поста-инструкции о том,как пользоваться Лентой новинок",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-30-1x1-use-01",
    assetId: "jestei-11-source-30-1x1",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Дизайн письма для реанимации клиентов",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-31-572x1400-use-01",
    assetId: "jestei-11-source-31-572x1400",
    projectIds: ["jestei-promo-communication"],
    caption: {
      title: "Дизайн письма для реанимации клиентов",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-32-550x412-use-01",
    assetId: "jestei-11-source-32-550x412",
    projectIds: ["jestei-brand-system", "jestei-promo-communication"],
    caption: {
      title: "Паттерн для дизайн баннеров 'Exclusive Edits' с использованием шейпов 2024",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-33-8x5-use-01",
    assetId: "jestei-11-source-33-8x5",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Шейпы и геометрические фигуры в дизайн системе",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-35-1x1-use-01",
    assetId: "jestei-11-source-35-1x1",
    projectIds: ["jestei-event", "jestei-promo-communication"],
    caption: {
      title: "Рекламный креатив для открытия свадебного сезона 2026",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-36-1289x1230-use-01",
    assetId: "jestei-11-source-36-1289x1230",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Обложка для плейлиста \"Электронные новинки\"",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-37-1x1-use-01",
    assetId: "jestei-11-source-37-1x1",
    projectIds: ["jestei-playlist-system"],
    caption: {
      title: "Коллажи для обложек плейлистов",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-38-16x9-use-01",
    assetId: "jestei-11-source-38-16x9",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Новая цветовая плаитра бренда",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-40-1260x898-use-01",
    assetId: "jestei-11-source-40-1260x898",
    projectIds: ["jestei-brand-system"],
    caption: {
      title: "Новый акцидентный шрифт бренда — Druk Wide",
    },
    purpose: "work",
  },
  {
    id: "jestei-11-source-41-216x484-use-01",
    assetId: "jestei-11-source-41-216x484",
    projectIds: ["jestei-subscription", "jestei-core-interface"],
    caption: {
      title: "Промовиджет в сайдбаре с предложением повысить тариф.",
    },
    purpose: "work",
  },
  {
    id: "jestei-12-source-01-1080x1080-use-01",
    assetId: "jestei-12-source-01-1080x1080",
    caption: {
      title: "Кадр кампейна для Olovo.",
    },
    purpose: "work",
  },
  {
    id: "jestei-13-source-01-16x9-use-01",
    assetId: "jestei-13-source-01-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-01-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-02-16x9-use-01",
    assetId: "jestei-13-source-02-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-02-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-03-16x9-use-01",
    assetId: "jestei-13-source-03-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-03-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-04-16x9-use-01",
    assetId: "jestei-13-source-04-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-04-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-05-16x9-use-01",
    assetId: "jestei-13-source-05-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-05-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-06-16x9-use-01",
    assetId: "jestei-13-source-06-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-06-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-07-16x9-use-01",
    assetId: "jestei-13-source-07-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-07-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-08-16x9-use-01",
    assetId: "jestei-13-source-08-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-08-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-09-16x9-use-01",
    assetId: "jestei-13-source-09-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-09-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-10-16x9-use-01",
    assetId: "jestei-13-source-10-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-10-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-11-16x9-use-01",
    assetId: "jestei-13-source-11-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-11-16x9",
    purpose: "work",
  },
  {
    id: "jestei-13-source-12-16x9-use-01",
    assetId: "jestei-13-source-12-16x9",
    projectIds: ["jestei-track-filter"],
    posterAssetId: "jestei-13-poster-12-16x9",
    purpose: "work",
  },
  {
    id: "jestei-14-source-01-4x5-use-01",
    assetId: "jestei-14-source-01-4x5",
    projectIds: ["jestei-promo-communication"],
    posterAssetId: "jestei-14-poster-01-4x5",
    purpose: "work",
  },
  {
    id: "jestei-13-source-13-1280x588-use-01",
    assetId: "jestei-13-source-13-1280x588",
    projectIds: ["jestei-landings"],
    posterAssetId: "jestei-13-poster-13-1280x588",
    caption: {
      title: "Лендинги Jestei Pool.",
      index: 21,
      text: "К 2025 году один общий лендинг уже не отражал устройство сервиса: появилось много новых инструментов,сценариев и была занята новая ниша — мы начали работать с музыкой для ивент-диджеев. Мы начали активно работать с таргетированный рекламой и единый лендинг перестал эффективно работать как рекламный инструмент: он не описывал всю продуктовую линейку сервиса и не позволял делать точечные рекламные предложения. Поэтому мы запустили систему из двух лендингов,каждый из которых состоит из набора промомодулей, каждый из которых решал свою рекламную цель.",
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-logo-jestei-pool-dark-use-01",
    assetId: "jestei-logo-source-logo-jestei-pool-dark",
    projectIds: ["jestei-brand-system"],
    alt: "Jestei Pool",
    purpose: "work",
  },
  {
    id: "jestei-logo-source-logo-jestei-pool-use-01",
    assetId: "jestei-logo-source-logo-jestei-pool",
    projectIds: ["jestei-brand-system"],
    alt: "Jestei Pool",
    purpose: "work",
  },
  {
    id: "jestei-redpolitika-preview-use-01",
    assetId: "jestei-redpolitika-preview",
    projectIds: ["jestei-editorial-policy"],
    alt: "Первый экран редполитики Jestei Pool",
    caption: {
      title: "Редполитика Jestei Pool.",
      index: 36,
    },
    purpose: "work",
  },
  {
    id: "jestei-logo-source-logo-secondary-use-01",
    assetId: "jestei-logo-source-logo-secondary",
    projectIds: ["jestei-brand-system"],
    purpose: "work",
  },
] as const satisfies readonly MediaEntryData<MediaAssetId, ProjectId, MediaCreditsId>[];

export type JesteiMediaEntry = (typeof jesteiMediaEntries)[number];
