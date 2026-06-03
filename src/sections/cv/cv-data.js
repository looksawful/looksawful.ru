const chip = (label, demoId) => (demoId ? { label, demoId } : label);

const getModuleUrl = (moduleValue) =>
  typeof moduleValue === "string" ? moduleValue : moduleValue?.default || "";

const getFilename = (path = "") => path.split(/[\\/]/).pop() || "";
const getStem = (filename = "") => filename.replace(/\.[^.]+$/, "");
const getReadableTitle = (stem = "") => stem.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

const createMediaItems = (modules, { limit, titlePrefix } = {}) =>
  Object.entries(modules)
    .map(([path, moduleValue]) => {
      const filename = getFilename(path);
      const stem = getStem(filename);

      return {
        src: getModuleUrl(moduleValue),
        alt: getReadableTitle(stem),
        filename,
        title: titlePrefix ? `${titlePrefix} ${getReadableTitle(stem)}` : getReadableTitle(stem),
        type: /\.(mp4|webm|mov)$/i.test(filename) ? "video" : "image",
      };
    })
    .filter((item) => item.src)
    .sort((a, b) => a.filename.localeCompare(b.filename, "ru", { numeric: true }))
    .slice(0, limit ?? Number.POSITIVE_INFINITY);

const mediaGroup = (items, options = {}) => ({
  type: "media-group",
  items,
  ...options,
});

const demo = (type, options = {}) => ({
  type,
  ...options,
});

const jesteiEditorialModules = import.meta.glob(
  "../../assets/cv/chip-content/01-jestei-pool/{05-proizvel-redizayn-lendinga-osnovnogo-produkta,33-sozdal-dizayn-oblozhek-pleylistov-na-sayte}/**/*.{webp,png,jpg,jpeg,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const styxArtDirectionModules = import.meta.glob("../../lab/assets/projects/styx/campaign-*.{webp,png,jpg,jpeg,avif}", {
  eager: true,
  query: "?url",
  import: "default",
});

const styxProductionModules = import.meta.glob(
  "../../lab/assets/projects/styx/{archive/legacy,media}/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const lyveInterfaceModules = import.meta.glob("../../assets/cv/animations/lyve-graphic-carousel/**/*.{webp,png,jpg,jpeg,avif}", {
  eager: true,
  query: "?url",
  import: "default",
});

const newsletterSources = [
  new URL("../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 8.png", import.meta.url)
    .href,
  new URL("../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 9.png", import.meta.url)
    .href,
];

const MEDIA_GROUPS = {
  jesteiEditorial: createMediaItems(jesteiEditorialModules, { limit: 18 }),
  styxArtDirection: createMediaItems(styxArtDirectionModules, { limit: 10 }),
  styxProduction: createMediaItems(styxProductionModules, { limit: 12 }),
  lyveInterface: createMediaItems(lyveInterfaceModules, { limit: 5 }),
};

export const CV_PROJECTS = [
  {
    id: "jesteipool",
    variant: "featured",
    title: "jestei pool",
    period: "с 2024",
    logo: {
      modifier: "jestei",
      type: "canvas",
      canvasId: "cv-jestei-logo-canvas",
      visualDemo: "three:logo",
    },
    roles: ["арт-директор", "ui/ux лид", "дизайн-лид", "продакт дизайнер"],
    copy: [
      "музыкальный сервис для диджеев, музыкальных редакторов и продюсеров. главный российский диджейский пул, с огромной музыкальной библиотекой для подготовки к выступлениям.",
    ],
    domains: [
      {
        area: "interface",
        title: "ux/ui лид",
        animation: {
          type: "horizontal",
          canvasId: "cv-jestei-interface-horizontal",
          scene: "jesteiInterfaceMasonry",
        },
        chips: [
          "Формирование UI/UX-стратегии сервиса",
          "Перевод бизнес-задач в дизайн-решения",
          "Арт-дирекшн страниц, разделов и лендингов",
          "Архитектура продуктовых дизайн-решений",
          "Формирование задач для дизайнеров",
          "Брифинг дизайнеров по целям, сценариям и ограничениям",
          "Контроль дизайн-процесса от брифа до релиза",
          "Синхронизация дизайнеров, продукта и разработки",
          "Курирование переработки дизайн-системы",
          "Внедрение единых интерфейсных стандартов",
          "Формирование правил сетки, полей и адаптива",
          "Формирование принципов типографики и цветовых тем",
          "Построение процесса работы с компонентами",
          "Внедрение переменных в дизайн-систему",
          "Настройка Dev Mode для передачи макетов",
          "Проектирование новых UI-организмов",
          "Формирование требований к компонентам",
          "Выявление и решение проблем продукта",
          "Выявление и решение проблем интерфейса",
          "Проектирование пользовательских сценариев",
          "Прототипирование продуктовых сценариев",
          "Создание CJM и оптимизация маршрутов",
          "Анализ тепловых карт и внедрение улучшений",
          "Переработка структуры страниц и разделов",
          "Переработка навигации внутри разделов",
          "Переработка тарифов и продуктовых блоков",
          "Курирование адаптивов для всех основных устройств",
          "Формирование требований к брейкпоинтам",
          "Контроль качества UI, UX и адаптива",
          "Проверка макетов перед разработкой",
          "Контроль соответствия макетов дизайн-системе",
          "Формирование правок для дизайнеров",
          "Ревью страниц отдельно от библиотеки компонентов",
          "Сопровождение макетов документацией",
          "Документация по сценариям и компонентам",
          "Подготовка спецификаций для разработки",
          "Технические комментарии для разработки",
          "Передача дизайн-решений в разработку",
          "Контроль реализации интерфейсов на сайте",
          "Тестирование интерфейсов после внедрения",
          "Формирование правок для разработчиков",
          "Ведение полного цикла интерфейсной задачи",
        ],
      },
      {
        area: "product",
        title: "продуктовый дизайн",
        animation: {
          type: "diagonal",
          canvasId: "cv-jestei-product-diagonal",
          scene: "jesteiProductHorizontal",
        },
        chips: [
          chip("Цветовая сегментация продуктов и аудиторий", "jestei-pool-audience-colors"),
          chip("Концепция «три подписки — три темы»", "jestei-pool-premium-products"),
          "Разделение сценариев для трёх аудиторий сервиса",
          "Инструменты под задачи каждой аудитории",
          chip("Фильтрация треков для основного каталога", "jestei-pool-02"),
          chip("Расширенная фильтрация для Event DJ", "jestei-pool-09"),
          "Архитектура основного лендинга",
          chip("Архитектура лендинга Event-раздела", "jestei-pool-07"),
          chip("Дизайн основного лендинга", "jestei-pool-05"),
          chip("Дизайн лендинга для Event DJ", "jestei-pool-07"),
          "Дизайн страницы трека",
          "Перестройка навигации Event-раздела",
          "Концепция «день для Event, ночь для клуба»",
          "Пояснительные тексты для плейлистов",
          "Группировка плейлистов по сценариям",
          "Упрощение вложенности глубоких разделов",
          "Система paywall, ограничений доступа и оверлеев",
          "Paywall-сценарии для разных тарифов",
          "Уведомления о нововведениях на сайте",
          "Модальные окна «Что нового»",
          "Триггеры апгрейда подписки",
          "Виджеты, CTA и модальные окна для апгрейда",
          chip("Дизайн тарифов", "jestei-pool-premium-products"),
          "Карты пользовательских маршрутов",
          "Структура и оформление плейлистов",
          chip("Дизайн динамических плейлистов", "jestei-pool-33"),
        ],
      },
      {
        area: "graphic",
        title: "графический дизайн",
        animation: {
          type: "arc",
          canvasId: "cv-jestei-graphic-arc",
          scene: "jesteiGraphicArc",
        },
        chips: [
          "Оптимизация системы баннеров",
          "Дизайн субтитров",
          "Оформление соцсетей",
          "Создание и арт-дирекшн баннеров",
          chip("Дизайн обложек плейлистов", "jestei-pool-33"),
          "Оформление сезонных акций",
          "Внедрение нейросетей в графический пайплайн",
        ],
      },
      {
        area: "graphic",
        title: "разработка фирменного стиля",
        demo: demo("logo-inspector", {
          id: "jestei-logo-inspector",
          minHeight: 520,
        }),
        chips: [
          "Ребрендинг сервиса",
          chip("Разработка фирменного стиля", "jestei-pool-brand-style"),
          chip("Разработка нового логотипа", "jestei-pool-24"),
          chip("Подбор брендового шрифта", "jestei-pool-25"),
          chip("Создание цветовой палитры", "jestei-pool-26"),
          "Разработка иконок",
        ],
      },
      {
        area: "development",
        title: "разработка",
        animations: [
          {
            type: "arc",
            canvasId: "cv-jestei-development-arc",
            scene: "jesteiLandingArc",
            tone: "dark",
            size: "square",
          },
          {
            type: "spiral",
            canvasId: "cv-jestei-development-spiral",
            scene: "jesteiLandingSpiral",
            tone: "dark",
            size: "square",
          },
        ],
        chips: [
          chip("Анимации для лендинга", "jestei-pool-36"),
          "Точечные правки CSS и TypeScript",
          "Коммиты в продуктовый код",
        ],
      },
      {
        area: "editorial",
        title: "редактура",
        media: mediaGroup(MEDIA_GROUPS.jesteiEditorial, {
          variant: "strip",
          auto: true,
          size: "wide",
        }),
        chips: [
          "Информирующий и вежливый тон текстов сайта",
          "Процесс редактирования интерфейсных текстов",
          "Система оповещений «Что нового?»",
          "Корректура текстов на сайте",
        ],
      },
      {
        area: "editorial",
        title: "дизайн брендовой рассылки",
        demo: demo("newsletter-canvas", {
          id: "jestei-newsletter-canvas",
          sources: newsletterSources,
          minHeight: 420,
          alt: "брендовые рассылки Jestei Pool",
        }),
        chips: [
          chip("Дизайн системы рассылок", "jestei-pool-newsletters"),
          chip("Дизайн рассылок бренда", "jestei-pool-newsletters"),
          "Интерфейсный тон промо-сообщений",
        ],
      },
    ],
  },
  {
    id: "Styx Jewels",
    variant: "featured",
    title: "Styx Jewels",
    period: "2021–2025",
    logo: {
      modifier: "styx",
      type: "image",
      name: "styx",
    },
    roles: ["графический дизайнер", "художник", "продюсер", "фотограф"],
    copy: ["Styx Jewel — нишевый бренд украшений, аксессуаров и одежды, вдохновлённый готической романтикой."],
    domains: [
      {
        area: "graphic",
        title: "графический дизайн",
        animation: {
          type: "diagonal",
          canvasId: "cv-styx-graphic-diagonal",
          scene: "styxGraphicDiagonal",
        },
        chips: [
          chip("ДНК бренда: логотип и фирменный стиль", "styx-brand-dna"),
          chip("Визуальная подача бренда", "styx-visual-presentation"),
          chip("Дизайн подарочной упаковки", "styx-packaging"),
          chip("Дизайн визиток", "styx-business-cards"),
          chip("Дизайн буклетов", "styx-booklets"),
          chip("Дизайн сертификатов", "styx-certificate"),
          chip("Дизайн соцсетей", "styx-social"),
          chip("Рекламные публикации", "styx-ads"),
          chip("Баннеры для Сплита и Долями", "styx-installments-banners"),
        ],
      },
      {
        area: "analysis",
        title: "арт-дирекшн",
        media: mediaGroup(MEDIA_GROUPS.styxArtDirection, {
          variant: "strip",
          auto: true,
          size: "portrait",
        }),
        chips: ["Концепция брендовых съёмок", chip("Стилистика кампейнов и каталожной съёмки", "styx-shoot-style")],
      },
      {
        area: "product",
        title: "фото и продакшен",
        media: mediaGroup(MEDIA_GROUPS.styxProduction, {
          variant: "orbit",
          size: "square",
          tone: "dark",
        }),
        chips: [
          chip("Продюсирование съёмок", "styx-shoot-production"),
          chip("Фотосъёмка кампейнов", "styx-campaign-photo"),
          chip("Организация мини-студии для каталога", "styx-mini-studio"),
          chip("Сканографические анимации для бренда", "styx-scanography"),
          chip("Ретушь и стилизация кадров", "styx-retouch"),
          "Обработка коллабораций и каталожных съёмок",
        ],
      },
    ],
  },
  {
    id: "Lyve Moscow",
    variant: "featured",
    title: "Lyve Moscow",
    period: "2025",
    logo: {
      modifier: "lyve",
      type: "image",
      name: "lyve",
    },
    roles: ["дизайнер бренда", "иллюстратор"],
    copy: ["Студия озеленения и ландшафтного дизайна с живым и художественным характером."],
    domains: [
      {
        area: "graphic",
        title: "графический дизайн",
        animation: { type: "carousel", canvasId: "cv-lyve-graphic-carousel" },
        chips: [
          "ДНК бренда на основе авторских иллюстраций",
          "Логотип для бренда",
          "Маскот бренда",
          "Иллюстрации для визуальной системы",
          "Дизайн руководства по уходу за растениями",
        ],
      },
      {
        area: "interface",
        title: "дизайн интерфейса",
        media: mediaGroup(MEDIA_GROUPS.lyveInterface, {
          variant: "strip",
          size: "wide",
        }),
        chips: ["Минималистичная дизайн-система сайта", "Игривый визуальный язык интерфейса"],
      },
    ],
  },
  {
    id: "sensetique",
    variant: "compact",
    title: "Sensetique photostudio",
    year: "2017-2018",
    detailsId: "cv-sensetique-studio-details",
    roles: ["директор фотостудии", "генеральный продюсер"],
    summary:
      "SENSETIQUE — московская фотостудия и продакшн для моды, рекламы и визуального контента. Студия объединяла съёмочные залы, белые циклорамы, естественный свет, реквизит и продюсерскую команду. Проекты строились вокруг fashion-съёмок, модельных тестов, лукбуков, каталогов, предметной фотографии и творческих съёмок.",
    domains: [
      { area: "analysis", title: "концепция", chips: ["Концепция фотостудии", "Бизнес-план запуска"] },
      {
        area: "product",
        title: "управление запуском",
        chips: [
          "Поиск и аренда помещения",
          "Строительство фотостудии",
          "Найм команды",
          "Координация строителей и ремонта",
          "Закупка оборудования для студии",
          "Организация первого потока клиентов",
        ],
      },
      {
        area: "analysis",
        title: "концепция и продажи",
        chips: [
          "Поиск и привлечение заказов",
          "Участие в тендерах",
          "Концепции съёмок",
          "Мудборды для проектов",
          "Креативные сессии и брейнштормы",
        ],
      },
      {
        area: "product",
        title: "продакшен",
        chips: [
          "Руководство разработкой клиентских сайтов",
          "Руководство дизайнерами",
          "Организация мероприятий",
          "Линейный продакшен для крупных съёмок",
          "Транспорт, кейтеринг и обеспечение площадки",
          "Локейшн-скаутинг",
          "Сборка съёмочных групп",
          "Продюсирование концертов и перформансов",
          "Закупка и аренда оборудования",
          "Организация и продажа мастер-классов",
          "Организация примерок",
          "Закупка и аренда костюмов для съёмок",
        ],
      },
      {
        area: "graphic",
        title: "съёмки",
        chips: [
          "Фото- и видеосъёмки",
          "Съёмки под ключ для зарубежных журналов",
          "Съёмки для российских глянцевых журналов",
        ],
      },
    ],
  },
  {
    id: "madcow",
    variant: "compact",
    title: "Mad Cow Films",
    year: "2019",
    detailsId: "cv-madcow-details",
    roles: ["ассистент продюсера"],
    summary:
      "Mad Cow Films — международный рекламный продакшн с офисами в Лондоне и Москве. Компания делает рекламные ролики, бренд-контент и съёмочные проекты для коммерческих клиентов. В работе соединяет креативную разработку, режиссёрскую базу, продюсирование, подготовку съёмок и сервисное производство.",
    domains: [
      { area: "editorial", title: "документы", chips: ["Документы для тендерных заявок", "Брифы и презентации", "Сборка проектной документации"] },
      {
        area: "analysis",
        title: "продюсирование",
        chips: [
          "Расчёт смет",
          "Участие в тендер-пичах",
          "Коммуникация с иностранными режиссёрами",
          "Коммуникация с режиссёрскими командами",
        ],
      },
      {
        area: "product",
        title: "подготовка съёмок",
        chips: ["Букинг специалистов в проекты", "Сборка кастов", "Локейшн-скаутинг", "Офисная координация проектов"],
      },
    ],
  },
  {
    id: "line",
    variant: "compact",
    title: "LI-NE Agency",
    year: "2017",
    detailsId: "cv-line-details",
    roles: ["ассистент продюсера", "jr-продюсер", "линейный продюсер"],
    summary:
      "LI-NE Agency — продакшн-агентство в сфере моды, рекламы и медиа. Компания делает съёмки, кастинги, визуальные проекты и продюсерское сопровождение для брендов, журналов, артистов и коммерческих клиентов. В проектах агентство объединяет fashion-фотографию, подбор команд, работу с площадками, логистику и съёмочную координацию.",
    domains: [
      {
        area: "analysis",
        title: "подготовка проектов",
        chips: ["Переговоры с подрядчиками", "Оптимизация смет и бюджетов", "Подготовка смет", "Мудборды для проектов", "Брифы для съёмок"],
      },
      {
        area: "product",
        title: "линейный продакшен",
        chips: [
          "Документы для генерального продюсера",
          "Локейшн-скаутинг для рекламных проектов",
          "Кастинги для рекламных проектов",
          "Транзиты, доставки и транспортировка группы",
          "Логистика селебрити, образов и оборудования",
          "Аренда оборудования",
          "Букинг съёмочных групп",
          "Координация на площадке и в офисе",
          "Линейные задачи на крупных рекламных съёмках",
          "Съёмки с международными брендами",
          "Организация мероприятий и бизнес-ланчей",
          "Работа на съёмках для изданий",
        ],
      },
      { area: "graphic", title: "презентации", chips: ["Презентации для проектов", "Проектные визуалы"] },
    ],
  },
  {
    id: "progress",
    variant: "compact",
    title: "Издательство Прогресс",
    year: "2013-2015",
    detailsId: "cv-progress-details",
    roles: ["книжный дизайнер"],
    summary:
      "Издательство «Прогресс» — российское издательство переводной, гуманитарной, художественной и образовательной литературы. Компания выпускает книги и работает с полным издательским циклом: текстом, структурой, редакционной подготовкой, иллюстрациями, вёрсткой и подготовкой материалов к печати.",
    domains: [
      { area: "analysis", title: "клиентская работа", chips: ["Переговоры с клиентами", "Анализ требований к изданию"] },
      {
        area: "graphic",
        title: "книжный дизайн",
        chips: ["Концепции и макеты книг", "Предпечатная подготовка иллюстраций", "Вёрстка и контроль процесса", "Подготовка книги к типографии"],
      },
    ],
  },
  {
    id: "ria",
    variant: "compact",
    title: "РИА НОВОСТИ газета Московские новости",
    year: "2012",
    detailsId: "cv-ria-details",
    roles: ["jr-верстальщик"],
    summary:
      "«Московские новости» / РИА Новости — ежедневная городская общественно-политическая газета о Москве. Издание писало о городской жизни, политике, экономике, культуре, обществе и повестке дня.",
    domains: [{ area: "graphic", title: "газетная вёрстка", chips: ["Вёрстка полос ежедневной газеты"] }],
  },
];
