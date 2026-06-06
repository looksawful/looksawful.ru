const getModuleUrl = (moduleValue) => (typeof moduleValue === "string" ? moduleValue : moduleValue?.default || "");

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

const MEDIA_CAPTION = "внимание: этот текст является рыбой.";

const demo = (type, options = {}) => ({
  type,
  ...options,
});

const TASK_GROUP_IMAGE_URLS = {
  "jestei-ui-ux-strategy.webp": new URL("../../assets/cv/task-group-images/jestei-ui-ux-strategy.webp", import.meta.url).href,
  "jestei-design-system.webp": new URL("../../assets/cv/task-group-images/jestei-design-system.webp", import.meta.url).href,
  "jestei-design-process.webp": new URL("../../assets/cv/task-group-images/jestei-design-process.webp", import.meta.url).href,
};

const getTaskGroupImageSrc = (filename) => {
  const normalizedFilename = String(filename || "").trim();
  return TASK_GROUP_IMAGE_URLS[normalizedFilename] || "";
};

const taskGroupImage = (filename, alt) => ({
  filename,
  src: getTaskGroupImageSrc(filename),
  alt,
});

const styxVisualSystemLoopUrl = new URL(
  "../../assets/cv/animations/styx-graphic-diagonal/styx-visual-system-loop-zwCa4H7L.mp4",
  import.meta.url,
).href;

const styxBasementLoopUrl = new URL(
  "../../assets/cv/animations/styx-graphic-diagonal/basement-16x9-Ci2Jjxc4.mp4",
  import.meta.url,
).href;

const jesteiEditorialModules = import.meta.glob(
  "../../assets/cv/chip-content/01-jestei-pool/{05-proizvel-redizayn-lendinga-osnovnogo-produkta,33-sozdal-dizayn-oblozhek-pleylistov-na-sayte}/**/*.{webp,png,jpg,jpeg,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const styxArtDirectionModules = import.meta.glob("../../assets/cv/animations/styx-graphic-diagonal/campaign-*.{webp,png,jpg,jpeg,avif}", {
  eager: true,
  query: "?url",
  import: "default",
});

const styxProductionModules = import.meta.glob(
  "../../assets/cv/animations/styx-graphic-diagonal/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const lyveInterfaceModules = import.meta.glob(
  "../../assets/cv/animations/lyve-graphic-carousel/**/*.{webp,png,jpg,jpeg,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const styxProductionItems = createMediaItems(styxProductionModules).filter(
  (item) =>
    !/(web interfaces|brand identity|design systems|3d cgi|lyve|plant|раст|уход|reference|variant|asset-|bottom)/i.test(
      `${item.title} ${item.filename}`,
    ) && !/(styx-visual-system-loop|basement-16x9)/i.test(item.filename),
);

const newsletterSources = [
  new URL(
    "../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 8.webp",
    import.meta.url,
  ).href,
  new URL(
    "../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 9.webp",
    import.meta.url,
  ).href,
];

const MEDIA_GROUPS = {
  jesteiEditorial: createMediaItems(jesteiEditorialModules, { limit: 18 }),
  styxArtDirection: createMediaItems(styxArtDirectionModules, { limit: 10 }),
  styxProduction: [...createMediaItems(styxArtDirectionModules, { limit: 6 }), ...styxProductionItems].slice(0, 18),
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
        // listLayout: "alternating-media visual-first-media",
        animation: {
          type: "masonry",
          canvasId: "cv-jestei-interface-masonry",
          scene: "jesteiInterfaceMasonry",
        },
        listGroups: [
          {
            title: "UI/UX стратегия сервиса",
            image: taskGroupImage("jestei-ui-ux-strategy.webp", "UI/UX стратегия сервиса Jestei Pool"),
            technologies: ["Figma", "CJM", "прототипы", "дизайн-система"],
            items: [
              "Арт-дирекшн интерфейсов сервиса",
              "Архитектура дизайн решений",
              "Проектирование новых UI-организмов",
              "Выявление и решение проблем интерфейса",
              "Прототипирование продуктовых сценариев",
              "Создание CJM и оптимизация маршрутов",
              "Перевод бизнес-задач в дизайн-решения",
              "Переработка структуры страниц и разделов",
              "Переработка навигации внутри разделов",
              "Прототипирование новых организмов и анимаций",
            ],
          },
          {
            title: "Архитектура дизайн-системы",
            image: taskGroupImage("jestei-design-system.webp", "Архитектура дизайн-системы Jestei Pool"),
            technologies: ["Figma", "Dev Mode", "tokens", "components"],
            items: [
              // "Настройка Dev Mode для передачи макетов",
              "Разработка интерфейсных стандартов",
              "Рефакторинг дизайн-системы",
              "Формирование требований к компонентам",
              "Формирование правил сетки, полей и адаптива",
              "Формирование принципов типографики и цветовых тем",
            ],
          },
          {
            title: "Контроль дизайн-процесса",
            image: taskGroupImage("jestei-design-process.webp", "Контроль дизайн-процесса Jestei Pool"),
            technologies: ["Figma", "Notion", "HTML", "CSS"],
            items: [
              "Формирование задач для дизайнеров",
              "Синхронизация дизайнеров, продукта и разработки",
              "Переработка дизайн-системы",
              "Контроль качества UI, UX и адаптива",
              "Сопровождение макетов документацией",
              "Подготовка спецификаций для разработки",
              "Контроль реализации интерфейсов на сайте",
              "Участие в написании css для новых компонентов",
            ],
          },
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
          "Цветовая сегментация продуктов и аудиторий",
          "Концепция «три подписки — три темы»",
          "Разделение сценариев для трёх аудиторий сервиса",
          "Инструменты под задачи каждой аудитории",
          "Фильтрация треков для основного каталога",
          "Расширенная фильтрация для Event DJ",
          "Архитектура основного лендинга",
          "Архитектура лендинга Event-раздела",
          "Дизайн основного лендинга",
          "Дизайн лендинга для Event DJ",
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
          "Дизайн тарифов",
          "Карты пользовательских маршрутов",
          "Структура и оформление плейлистов",
          "Дизайн динамических плейлистов",
        ],
      },
      // {
      //   area: "graphic",
      //   title: "графический дизайн",
      //   animation: {
      //     type: "arc",
      //     canvasId: "cv-jestei-graphic-arc",
      //     scene: "jesteiGraphicArc",
      //     tone: "dark",
      //   },
      //   chips: [
      //     "Оптимизация системы баннеров",
      //     "Дизайн субтитров",
      //     "Оформление соцсетей",
      //     "Создание и арт-дирекшн баннеров",
      //     "Дизайн обложек плейлистов",
      //     "Оформление сезонных акций",
      //     "Внедрение нейросетей в графический пайплайн",
      //   ],
      // },
      {
        area: "graphic",
        title: "разработка фирменного стиля",
        layout: "two-column media-right compact",
        demo: demo("logo-inspector", {
          id: "jestei-logo-inspector",
          minHeight: 520,
        }),
        chips: [
          "Ребрендинг сервиса",
          "Разработка фирменного стиля",
          "Разработка нового логотипа",
          "Подбор брендового шрифта",
          "Создание цветовой палитры",
          "Разработка иконок",
        ],
      },
      // {s
      // {
      //   area: "editorial",
      //   title: "редактура",
      //   media: mediaGroup(MEDIA_GROUPS.jesteiEditorial, {
      //     variant: "strip",
      //     auto: true,
      //     size: "wide",
      //     speed: "92s",
      //   }),
      //   chips: [
      //     "Информирующий и вежливый тон текстов сайта",
      //     "Процесс редактирования интерфейсных текстов",
      //     "Система оповещений «Что нового?»",
      //     "Корректура текстов на сайте",
      //   ],
      // },
      // {
      //   area: "editorial",
      //   title: "дизайн брендовой рассылки",
      //   layout: "two-column media-left compact",
      //   demo: demo("newsletter-canvas", {
      //     id: "jestei-newsletter-canvas",
      //     sources: newsletterSources.slice(0, 1),
      //     minHeight: 460,
      //     alt: "брендовые рассылки Jestei Pool",
      //   }),
      //   chips: [
      //     "Дизайн системы рассылок",
      //     "Дизайн рассылок бренда",
      //     "Интерфейсный тон промо-сообщений",
      //   ],
      // },
    ],
  },
  {
    id: "Styx Jewels",
    variant: "featured",
    title: "styx jewels",
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
        listLayout: "alternating-media",
        animation: {
          type: "diagonal",
          canvasId: "cv-styx-graphic-diagonal",
          scene: "styxGraphicDiagonal",
        },
        chips: [
          "ДНК бренда: логотип и фирменный стиль",
          "Визуальная подача бренда",
          "Дизайн подарочной упаковки",
          "Дизайн визиток",
          "Дизайн буклетов",
          "Дизайн сертификатов",
          "Дизайн соцсетей",
          "Рекламные публикации",
          "Баннеры для Сплита и Долями",
        ],
      },
      {
        area: "analysis",
        title: "фирменный стиль",
        media: mediaGroup(MEDIA_GROUPS.styxArtDirection, {
          variant: "strip",
          auto: true,
          size: "portrait",
        }),
        chips: [
          "брендовая упаковка",
          "дизайн печатной продукции",
          "дизайн сертификатов",
          "дизайн рекламы",
          "дизайн буклетов",
        ],
      },
      {
        area: "product",
        title: "фото и продакшен",
        media: mediaGroup(MEDIA_GROUPS.styxProduction, {
          variant: "orbit",
          size: "square",
          tone: "dark",
          speed: "320s",
        }),
        chips: [
          "Продюсирование съёмок",
          "Фотосъёмка кампейнов",
          "Организация мини-студии для каталога",
          "Ретушь и стилизация кадров",
          "Обработка коллабораций и каталожных съёмок",
        ],
      },
      {
        area: "product",
        title: "сканографические анимации для бренда",
        layout: "two-column media-right compact collapse-on-mobile",
        animations: [
          {
            type: "video",
            src: styxVisualSystemLoopUrl,
            label: "styx visual system loop",
            size: "square",
          },
          {
            type: "video",
            src: styxBasementLoopUrl,
            label: "styx basement loop",
            size: "square",
          },
        ],
        chips: [
          "Сканографические анимации для бренда",
          "Подготовка видеоанимаций для коммуникаций",
          "Два видеолупа с ручным включением звука",
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
        layout: "two-column media-left compact",
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
        layout: "two-column media-left compact",
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
      {
        area: "editorial",
        title: "документы",
        chips: ["Документы для тендерных заявок", "Брифы и презентации", "Сборка проектной документации"],
      },
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
        chips: [
          "Переговоры с подрядчиками",
          "Оптимизация смет и бюджетов",
          "Подготовка смет",
          "Мудборды для проектов",
          "Брифы для съёмок",
        ],
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
      {
        area: "analysis",
        title: "клиентская работа",
        chips: ["Переговоры с клиентами", "Анализ требований к изданию"],
      },
      {
        area: "graphic",
        title: "книжный дизайн",
        chips: [
          "Концепции и макеты книг",
          "Предпечатная подготовка иллюстраций",
          "Вёрстка и контроль процесса",
          "Подготовка книги к типографии",
        ],
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


