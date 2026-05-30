const asset = (path) => new URL(path, import.meta.url).href;

const image = (src, alt = "") => ({ type: "image", src, alt });
const darkImage = (src, alt = "") => ({ ...image(src, alt), theme: "dark" });
const video = (src, title = "video") => ({ type: "video", src, title });
const code = (title, source) => ({ type: "code", title, source });
const three = (scene, title = "") => ({ type: "three", scene, title });
const canvasDemo = (demo, title = "") => ({ type: "canvas", demo, title });
const logoInspector = (title = "3D-превью логотипа Jestei Pool", options = {}) => ({ type: "logo-inspector", title, ...options });
const newsletterCanvas = (sources, title = "canvas рассылки", options = {}) => ({ type: "newsletter-canvas", sources, title, ...options });
const frameSequence = (frames, title = "") => ({ type: "frame-sequence", frames, title });

export const CV_TASK_DEMOS = {
  "jestei-pool-02": {
    project: "Jestei Pool",
    title: "разработал новый дизайн фильтра для треков для двух продуктов",
    preview: "Интерфейсные материалы к фильтру: состояния, крупные экраны и фрагменты логики выбора.",
    summary: "Интерфейсные материалы к фильтру: состояния, крупные экраны и фрагменты логики выбора.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Frame 1171277132.png"), "Frame 1171277132"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Frame 1171277132.png"), "Frame 1171277132"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Record Pool.png"), "Record Pool"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Screenshot 2026-05-30 163749.png"), "Screenshot 2026 05 30 163749"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Section 6.png"), "Section 6"),
    ],
    cards: [
      {
        title: "Record Pool",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Record Pool.png"), "Record Pool")],
      },
      {
        title: "Screenshot 2026 05 30 163749",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Screenshot 2026-05-30 163749.png"), "Screenshot 2026 05 30 163749")],
      },
      {
        title: "Section 6",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov/Section 6.png"), "Section 6")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/02-razrabotal-novyy-dizayn-filtra-dlya-trekov-dlya-dvuh-produktov",
    fileCount: 4,
  },
  "jestei-pool-05": {
    project: "Jestei Pool",
    title: "произвел редизайн лендинга основного продукта",
    preview: "Материалы лендинга: ключевые секции, продуктовые блоки и визуальная сборка страницы.",
    summary: "Материалы лендинга: ключевые секции, продуктовые блоки и визуальная сборка страницы.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/1920+.png"), "1920+"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/1920+.png"), "1920+"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Billing Section.png"), "Billing Section"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Event Playlist Section.png"), "Event Playlist Section"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Exclusives Section.png"), "Exclusives Section"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Genres Section.png"), "Genres Section"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Playlists Section.png"), "Playlists Section"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Track List Section _1440.png"), "Track List Section 1440"),
    ],
    cards: [
      {
        title: "Billing Section",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Billing Section.png"), "Billing Section")],
      },
      {
        title: "Event Playlist Section",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Event Playlist Section.png"), "Event Playlist Section")],
      },
      {
        title: "Exclusives Section",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Exclusives Section.png"), "Exclusives Section")],
      },
      {
        title: "Genres Section",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Genres Section.png"), "Genres Section")],
      },
      {
        title: "Playlists Section",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Playlists Section.png"), "Playlists Section")],
      },
      {
        title: "Track List Section 1440",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta/Track List Section _1440.png"), "Track List Section 1440")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/05-proizvel-redizayn-lendinga-osnovnogo-produkta",
    fileCount: 7,
  },
  "jestei-pool-07": {
    project: "Jestei Pool",
    title: "придумал дизайн для лендинга ивент-диджеев",
    preview: "Материалы лендинга: ключевые секции, продуктовые блоки и визуальная сборка страницы.",
    summary: "Материалы лендинга: ключевые секции, продуктовые блоки и визуальная сборка страницы.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/07-pridumal-dizayn-dlya-lendinga-ivent-didzheev/Event_block.png"), "Event block"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/07-pridumal-dizayn-dlya-lendinga-ivent-didzheev/Event_block.png"), "Event block"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/07-pridumal-dizayn-dlya-lendinga-ivent-didzheev/Group 3.png"), "Group 3"),
    ],
    cards: [
      {
        title: "Group 3",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/07-pridumal-dizayn-dlya-lendinga-ivent-didzheev/Group 3.png"), "Group 3")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/07-pridumal-dizayn-dlya-lendinga-ivent-didzheev",
    fileCount: 2,
  },
  "jestei-pool-09": {
    project: "Jestei Pool",
    title: "создал фильтр для ивента",
    preview: "Интерфейсные материалы к фильтру: состояния, крупные экраны и фрагменты логики выбора.",
    summary: "Интерфейсные материалы к фильтру: состояния, крупные экраны и фрагменты логики выбора.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/09-sozdal-filtr-dlya-iventa/Screenshot 2026-05-30 163911.png"), "Screenshot 2026 05 30 163911"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/09-sozdal-filtr-dlya-iventa/Screenshot 2026-05-30 163911.png"), "Screenshot 2026 05 30 163911"),
    ],
    cards: [
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/09-sozdal-filtr-dlya-iventa",
    fileCount: 1,
  },
  "jestei-pool-24": {
    project: "Jestei Pool",
    title: "разработал новый логотип",
    preview: "Логотип и знаковая система: версии знака, схема построения, анимационные кадры и варианты применения.",
    summary: "Логотип и знаковая система: версии знака, схема построения, анимационные кадры и варианты применения.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/49de98d1-0fa0-4e4c-a8c2-58bce7b593fe.png"), "49de98d1 0fa0 4e4c a8c2 58bce7b593fe"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/49de98d1-0fa0-4e4c-a8c2-58bce7b593fe.png"), "49de98d1 0fa0 4e4c a8c2 58bce7b593fe"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-1.png"), "logo scheme animation frame 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-2.png"), "logo scheme animation frame 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-3.png"), "logo scheme animation frame 3"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-4.png"), "logo scheme animation frame 4"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-5.png"), "logo scheme animation frame 5"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-6.png"), "logo scheme animation frame 6"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-7.png"), "logo scheme animation frame 7"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-1.png"), "logo scheme animation frame logo new 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-2.png"), "logo scheme animation frame logo new 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-3.png"), "logo scheme animation frame logo new 3"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new.png"), "logo scheme animation frame logo new"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/Поланя версия логотипа.png"), "Поланя версия логотипа"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/Схема шильда.png"), "Схема шильда"),
    ],
    cards: [
      {
        title: "logo scheme animation frame 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-1.png"), "logo scheme animation frame 1")],
      },
      {
        title: "logo scheme animation frame 2",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-2.png"), "logo scheme animation frame 2")],
      },
      {
        title: "logo scheme animation frame 3",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-3.png"), "logo scheme animation frame 3")],
      },
      {
        title: "logo scheme animation frame 4",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-4.png"), "logo scheme animation frame 4")],
      },
      {
        title: "logo scheme animation frame 5",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-5.png"), "logo scheme animation frame 5")],
      },
      {
        title: "logo scheme animation frame 6",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-6.png"), "logo scheme animation frame 6")],
      },
      {
        title: "logo scheme animation frame 7",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-7.png"), "logo scheme animation frame 7")],
      },
      {
        title: "logo scheme animation frame logo new 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-1.png"), "logo scheme animation frame logo new 1")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip",
    fileCount: 14,
  },
  "jestei-pool-25": {
    project: "Jestei Pool",
    title: "подобрал брендовый шрифт",
    preview: "Подбор брендового шрифта: визуальный тон, читаемость и связка типографики с интерфейсом и айдентикой.",
    summary: "Подбор брендового шрифта: визуальный тон, читаемость и связка типографики с интерфейсом и айдентикой.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Desktop - 152.png"), "Desktop 152"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Desktop - 152.png"), "Desktop 152"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Group 1171277123.png"), "Group 1171277123"),
    ],
    cards: [
      {
        title: "Group 1171277123",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Group 1171277123.png"), "Group 1171277123")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift",
    fileCount: 2,
  },
  "jestei-pool-26": {
    project: "Jestei Pool",
    title: "создал цветовую палитру",
    preview: "Цветовая система Jestei Pool: продуктовые темы, градиенты, состояния интерфейса и правила использования цвета в разных блоках.",
    summary: "Цветовая система Jestei Pool: продуктовые темы, градиенты, состояния интерфейса и правила использования цвета в разных блоках.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Cover/colors.png"), "colors"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Cover/colors.png"), "colors"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Ads_block.png"), "Ads block"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Alert.png"), "Alert"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system site.png"), "Color system site"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system tokens.png"), "Color system tokens"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-1.png"), "Color system 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-2.png"), "Color system 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-3.png"), "Color system 3"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system.png"), "Color system"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-1.png"), "Gradient background layout 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-2.png"), "Gradient background layout 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-3.png"), "Gradient background layout 3"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-4.png"), "Gradient background layout 4"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-5.png"), "Gradient background layout 5"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-6.png"), "Gradient background layout 6"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-7.png"), "Gradient background layout 7"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-8.png"), "Gradient background layout 8"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout-9.png"), "Gradient background layout 9"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background - layout.png"), "Gradient background layout"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background-1.png"), "Gradient background 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background-2.png"), "Gradient background 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background-3.png"), "Gradient background 3"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background-4.png"), "Gradient background 4"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Gradient background-5.png"), "Gradient background 5"),
    ],
    cards: [
      {
        title: "Ads block",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Ads_block.png"), "Ads block")],
      },
      {
        title: "Alert",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Alert.png"), "Alert")],
      },
      {
        title: "Color system site",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system site.png"), "Color system site")],
      },
      {
        title: "Color system tokens",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system tokens.png"), "Color system tokens")],
      },
      {
        title: "Color system 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-1.png"), "Color system 1")],
      },
      {
        title: "Color system 2",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-2.png"), "Color system 2")],
      },
      {
        title: "Color system 3",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system-3.png"), "Color system 3")],
      },
      {
        title: "Color system",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru/Details/Color system.png"), "Color system")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/26-sozdal-cvetovuyu-palitru",
    fileCount: 25,
  },
  "jestei-pool-33": {
    project: "Jestei Pool",
    title: "создал дизайн обложек плейлистов на сайте",
    preview: "Серия обложек плейлистов: много визуалов в одной системе, где важно удержать ритм, узнаваемость и разнообразие.",
    summary: "Серия обложек плейлистов: много визуалов в одной системе, где важно удержать ритм, узнаваемость и разнообразие.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - День Победы 1.png"), "001 День Победы 1"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - День Победы 1.png"), "001 День Победы 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Дискотека 1.png"), "001 Дискотека 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Под гитару 1.png"), "001 Под гитару 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Сбор гостей 1.png"), "001 Сбор гостей 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Сбор гостей 2.png"), "001 Сбор гостей 2"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Russian Halloween 1.png"), "001 Russian Halloween 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Welcome 1.png"), "001 Welcome 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Корпоратив 1.png"), "002 Корпоратив 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Лирический фон 1.png"), "002 Лирический фон 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Отбивки 1.png"), "002 Отбивки 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Подложки 1.png"), "002 Подложки 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Хиты в обработках 1.png"), "002 Хиты в обработках 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Halloween 2025 1.png"), "002 Halloween 2025 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - 23 февраля 1.png"), "003 23 февраля 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Выход жениха 1.png"), "003 Выход жениха 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Гид по танцам 1.png"), "003 Гид по танцам 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Отбивки 1.png"), "003 Отбивки 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Подложки 1.png"), "003 Подложки 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Свадьба 1.png"), "003 Свадьба 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/003 - Samples 1.png"), "003 Samples 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/004 - Видеозаставки 1.png"), "004 Видеозаставки 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/004 - Витольд Фантастика 1.png"), "004 Витольд Фантастика 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/004 - Выход невесты 1.png"), "004 Выход невесты 1"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/004 - Масленица 1.png"), "004 Масленица 1"),
    ],
    cards: [
      {
        title: "001 Дискотека 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Дискотека 1.png"), "001 Дискотека 1")],
      },
      {
        title: "001 Под гитару 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Под гитару 1.png"), "001 Под гитару 1")],
      },
      {
        title: "001 Сбор гостей 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Сбор гостей 1.png"), "001 Сбор гостей 1")],
      },
      {
        title: "001 Сбор гостей 2",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Сбор гостей 2.png"), "001 Сбор гостей 2")],
      },
      {
        title: "001 Russian Halloween 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Russian Halloween 1.png"), "001 Russian Halloween 1")],
      },
      {
        title: "001 Welcome 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/001 - Welcome 1.png"), "001 Welcome 1")],
      },
      {
        title: "002 Корпоратив 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Корпоратив 1.png"), "002 Корпоратив 1")],
      },
      {
        title: "002 Лирический фон 1",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte/Cover/002 - Лирический фон 1.png"), "002 Лирический фон 1")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/33-sozdal-dizayn-oblozhek-pleylistov-na-sayte",
    fileCount: 56,
  },
  "jestei-pool-36": {
    project: "Jestei Pool",
    title: "придумал и написал анимации для лендинга",
    preview: "Материалы к задаче: код canvas-анимаций для лендинга, ассеты для движущихся галерей и визуальные кадры для проверки результата.",
    summary: "Материалы к задаче: код canvas-анимаций для лендинга, ассеты для движущихся галерей и визуальные кадры для проверки результата.",
    previewMedia: image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/70s.webp"), "70s"),
    media: [
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/70s.webp"), "70s"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/80s.webp"), "80s"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/90s.webp"), "90s"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/afro-house.webp"), "afro house"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/ai.webp"), "ai"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/amapiano.webp"), "amapiano"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/apple-music.webp"), "apple music"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/bass-house.webp"), "bass house"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/billboard.webp"), "billboard"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/blaash.webp"), "blaash"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/drum-and-bass.webp"), "drum and bass"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/dubstep.webp"), "dubstep"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/khity.webp"), "khity"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/luchshie-treki-mesyatsa.webp"), "luchshie treki mesyatsa"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/mages.webp"), "mages"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/memy-i-prikoly.webp"), "memy i prikoly"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/mirovye-novinki.webp"), "mirovye novinki"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/moombahton.webp"), "moombahton"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/novaya-volna.webp"), "novaya volna"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/organic-and-melodic-house.webp"), "organic and melodic house"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/r-and-b-classic.webp"), "r and b classic"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/rave.webp"), "rave"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/reels-top.webp"), "reels top"),
      image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/rock-hits.webp"), "rock hits"),
      code("arc.js", "const ARC_KEY_PREFIX = \"arc:\";\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst arcItems = [\n  {\n    imageUrl: new URL(\"./assets/arc/70s.webp\", import.meta.url).href,\n    title: \"70's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/80s.webp\", import.meta.url).href,\n    title: \"80's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/90s.webp\", import.meta.url).href,\n    title: \"90's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/afro-house.webp\", import.meta.url).href,\n    title: \"Afro House\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/ai.webp\", import.meta.url).href,\n    title: \"AI\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/amapiano.webp\", import.meta.url).href,\n    title: \"Amapiano\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/apple-music.webp\", import.meta.url).href,\n    title: \"Apple Music\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/bass-house.webp\", import.meta.url).href,\n    title: \"Bass House\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/billboard.webp\", import.meta.url).href,\n    title: \"Billboard\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/blaash.webp\", import.meta.url).href,\n    title: \"BLAASH\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/drum-and-bass.webp\", import.meta.url).href,\n    title: \"Drum & Bass\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/dubstep.webp\", import.meta.url).href,\n    title: \"Dubstep\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/khity.webp\", import.meta.url).href,\n    title: \"Хиты\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/luchshie-treki-mesyatsa.webp\", import.meta.url).href,\n    title: \"Лучшие треки месяца\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/mages.webp\", import.meta.url).href,\n    title: \"Mages\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/memy-i-prikoly.webp\", import.meta.url).href,\n    title: \"Мемы и приколы\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/mirovye-novinki.webp\", import.meta.url).href,\n    title: \"Мировые новинки\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/moombahton.webp\", import.meta.url).href,\n    title: \"Moombahton\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/novaya-volna.webp\", import.meta.url).href,\n    title: \"Новая волна\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/organic-and-melodic-house.webp\", import.meta.url).href,\n    title: \"Organic & Melodic House\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/r-and-b-classic.webp\", import.meta.url).href,\n    title: \"R&B Classic\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/rave.webp\", import.meta.url).href,\n    title: \"Rave\",\n  },\n  {\n    imageUrl: new URL(\"./asse\n/* ...файл длиннее, продолжение лежит в ассетах чипа... */"),
      code("masonry.js", "const MASONRY_KEY_PREFIX = \"masonry:\";\n\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst masonryItems = [\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (2).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (3).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (4).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (5).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (6).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (7).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (8).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (9).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (10).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (11).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (12).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (13).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (14).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (15).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (16).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (17).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (18).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (19).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (20).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (21).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (22).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (23).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (24).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (27).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (28).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (30).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (31).webp\", import.meta.u\n/* ...файл длиннее, продолжение лежит в ассетах чипа... */"),
      code("spiral.js", "const SPIRAL_KEY_PREFIX = \"spiral:\";\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst spiralCoverUrls = [\n  new URL(\"./assets/spiral/14-fevralya.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/techno.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/unknown-blue-flare.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/hip-hop-classic.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/phonk.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/club-hits.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/remiksy.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/novaya-shkola.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/indie-dance.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/hyper-pop.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/khity-russian.webp\", import.meta.url).href,\n];\n\nconst config = {\n  speed: 0.00004,\n  turns: 1.5,\n  cardScale: 0.25,\n  cardGrowthScale: 1.5,\n  radiusScale: 0.4,\n  alphaScale: 2,\n};\n\nconst noop = () => {};\n\nconst getAnimationKey = (canvasId) => `${SPIRAL_KEY_PREFIX}${canvasId}`;\n\nconst beginMount = (key) => {\n  const token = Symbol(key);\n\n  pendingMounts.set(key, token);\n  disposeCanvasAnimation(key);\n  return token;\n};\n\nconst isCurrentMount = (key, token) => pendingMounts.get(key) === token;\n\nconst completeMount = (key, token, dispose) => () => {\n  if (isCurrentMount(key, token)) {\n    pendingMounts.delete(key);\n  }\n\n  dispose();\n};\n\nconst getDevicePixelRatio = () => Math.max(1, globalThis.devicePixelRatio || globalThis.window?.devicePixelRatio || 1);\n\nconst resizeCanvasToDisplaySize = (canvas, ctx, dpr = getDevicePixelRatio()) => {\n  const width = Math.max(1, Math.round((canvas.clientWidth || 0) * dpr));\n  const height = Math.max(1, Math.round((canvas.clientHeight || 0) * dpr));\n  const changed = canvas.width !== width || canvas.height !== height;\n\n  if (changed) {\n    canvas.width = width;\n    canvas.height = height;\n  }\n\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n  return changed;\n};\n\nconst disposeCanvasAnimation = (key) => {\n  const dispose = activeAnimations.get(key);\n\n  if (!dispose) {\n    return;\n  }\n\n  dispose();\n};\n\nconst disposeCanvasAnimationsByPrefix = (prefix) => {\n  [...activeAnimations.keys()].forEach((key) => {\n    if (key.startsWith(prefix)) {\n      disposeCanvasAnimation(key);\n    }\n  });\n};\n\nconst createCanvasAnimation = ({ key, canvas, ctx, renderFrame }) => {\n  disposeCanvasAnimation(key);\n\n  let disposed = false;\n  let frameId;\n  let running = false;\n  let reducedMotion = false\n/* ...файл длиннее, продолжение лежит в ассетах чипа... */"),
    ],
    cards: [
      {
        title: "70s",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/70s.webp"), "70s")],
      },
      {
        title: "80s",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/80s.webp"), "80s")],
      },
      {
        title: "90s",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/90s.webp"), "90s")],
      },
      {
        title: "afro house",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/afro-house.webp"), "afro house")],
      },
      {
        title: "ai",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/ai.webp"), "ai")],
      },
      {
        title: "amapiano",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/amapiano.webp"), "amapiano")],
      },
      {
        title: "apple music",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/apple-music.webp"), "apple music")],
      },
      {
        title: "bass house",
        text: "Материал из папки Details для этой задачи.",
        media: [image(asset("../../assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc/bass-house.webp"), "bass house")],
      },
      {
        title: "arc.js",
        text: "Фрагмент кода, который ты положил в Details.",
        media: [code("arc.js", "const ARC_KEY_PREFIX = \"arc:\";\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst arcItems = [\n  {\n    imageUrl: new URL(\"./assets/arc/70s.webp\", import.meta.url).href,\n    title: \"70's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/80s.webp\", import.meta.url).href,\n    title: \"80's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/90s.webp\", import.meta.url).href,\n    title: \"90's\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/afro-house.webp\", import.meta.url).href,\n    title: \"Afro House\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/ai.webp\", import.meta.url).href,\n    title: \"AI\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/amapiano.webp\", import.meta.url).href,\n    title: \"Amapiano\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/apple-music.webp\", import.meta.url).href,\n    title: \"Apple Music\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/bass-house.webp\", import.meta.url).href,\n    title: \"Bass House\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/billboard.webp\", import.meta.url).href,\n    title: \"Billboard\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/blaash.webp\", import.meta.url).href,\n    title: \"BLAASH\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/drum-and-bass.webp\", import.meta.url).href,\n    title: \"Drum & Bass\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/dubstep.webp\", import.meta.url).href,\n    title: \"Dubstep\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/khity.webp\", import.meta.url).href,\n    title: \"Хиты\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/luchshie-treki-mesyatsa.webp\", import.meta.url).href,\n    title: \"Лучшие треки месяца\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/mages.webp\", import.meta.url).href,\n    title: \"Mages\",\n  },\n  {\n    imageUrl: new URL(\"./assets/arc/memy-i-prikol\n/* ... */")],
      },
      {
        title: "masonry.js",
        text: "Фрагмент кода, который ты положил в Details.",
        media: [code("masonry.js", "const MASONRY_KEY_PREFIX = \"masonry:\";\n\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst masonryItems = [\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (2).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (3).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (4).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (5).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (6).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (7).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (8).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (9).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (10).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (11).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (12).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (13).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (14).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (15).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (16).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (17).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (18).webp\", import.meta.url).href },\n  { imageUrl: new URL(\"./assets/masonry/masonry-image (19).webp\", import.meta.url).href },\n  { ima\n/* ... */")],
      },
      {
        title: "spiral.js",
        text: "Фрагмент кода, который ты положил в Details.",
        media: [code("spiral.js", "const SPIRAL_KEY_PREFIX = \"spiral:\";\nconst pendingMounts = new Map();\nconst activeAnimations = new Map();\nconst imageCache = new Map();\n\nconst spiralCoverUrls = [\n  new URL(\"./assets/spiral/14-fevralya.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/techno.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/unknown-blue-flare.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/hip-hop-classic.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/phonk.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/club-hits.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/remiksy.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/novaya-shkola.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/indie-dance.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/hyper-pop.webp\", import.meta.url).href,\n  new URL(\"./assets/spiral/khity-russian.webp\", import.meta.url).href,\n];\n\nconst config = {\n  speed: 0.00004,\n  turns: 1.5,\n  cardScale: 0.25,\n  cardGrowthScale: 1.5,\n  radiusScale: 0.4,\n  alphaScale: 2,\n};\n\nconst noop = () => {};\n\nconst getAnimationKey = (canvasId) => `${SPIRAL_KEY_PREFIX}${canvasId}`;\n\nconst beginMount = (key) => {\n  const token = Symbol(key);\n\n  pendingMounts.set(key, token);\n  disposeCanvasAnimation(key);\n  return token;\n};\n\nconst isCurrentMount = (key, token) => pendingMounts.get(key) === token;\n\nconst completeMount = (key, token, dispose) => () => {\n  if (isCurrentMount(key, token)) {\n    pendingMounts.delete(key);\n  }\n\n  dispose();\n};\n\nconst getDevicePixelRatio = () => Math.max(1, globalThis.devicePixelRatio || globalThis.window?.devicePixelRatio || 1);\n\nconst resizeCanvasToDisplaySize = (canvas, ctx, dpr = getDevicePixelRatio()) => {\n  const width = Math.max(1, Math.round((canvas.clientWidth || 0) * dpr));\n  const \n/* ... */")],
      },
    ],
    assetPath: "src/assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga",
    fileCount: 110,
  },
};

CV_TASK_DEMOS["jestei-pool-24"] = {
  project: "Jestei Pool",
  title: "разработал новый логотип",
  preview: "3D-логотип и покадровая схема: видно, как знак собирается из формы и становится рабочей айдентикой.",
  summary: "Показываю логотип как систему: 3D-версию знака, последовательность сборки формы и статичные материалы для проверки применения.",
  previewMedia: three("logo", "3D-логотип Jestei Pool"),
  media: [
    three("logo", "3D-логотип Jestei Pool"),
    frameSequence(
      [
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-1.png"), "схема логотипа, кадр 1"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-2.png"), "схема логотипа, кадр 2"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-3.png"), "схема логотипа, кадр 3"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-4.png"), "схема логотипа, кадр 4"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-5.png"), "схема логотипа, кадр 5"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-6.png"), "схема логотипа, кадр 6"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-7.png"), "схема логотипа, кадр 7"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-1.png"), "новый логотип, кадр 1"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-2.png"), "новый логотип, кадр 2"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new-3.png"), "новый логотип, кадр 3"),
        image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/анимация схемы логотипа/logo-scheme-animation-frame-logo-new.png"), "финальный новый логотип"),
      ],
      "Покадровая схема логотипа",
    ),
    image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/Поланя версия логотипа.png"), "полная версия логотипа"),
    image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/Схема шильда.png"), "схема шильда"),
    image(asset("../../assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip/49de98d1-0fa0-4e4c-a8c2-58bce7b593fe.png"), "вариант применения логотипа"),
  ],
  cards: [],
  assetPath: "src/assets/cv/chip-content/01-jestei-pool/24-razrabotal-novyy-logotip",
  fileCount: 14,
};

CV_TASK_DEMOS["jestei-pool-36"] = {
  project: "Jestei Pool",
  title: "придумал и написал анимации для лендинга",
  preview: "Живые canvas-анимации лендинга: masonry, arc и spiral, подключенные как рабочие сцены.",
  summary: "В этом чипе не показываю код как главный материал. Здесь стоят сами интерактивные canvas-анимации лендинга, чтобы было видно результат движения и композиции.",
  previewMedia: canvasDemo("masonry", "Masonry-анимация лендинга"),
  media: [
    canvasDemo("masonry", "Masonry-анимация лендинга"),
    canvasDemo("arc", "Arc-анимация лендинга"),
    canvasDemo("spiral", "Spiral-анимация лендинга"),
  ],
  cards: [],
  assetPath: "src/assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga",
  fileCount: 110,
};

function markMediaDark(media) {
  if (!media) {
    return media;
  }

  if (media.type === "image") {
    media.theme = "dark";
  }

  if (media.type === "frame-sequence") {
    media.theme = "dark";
    media.frames?.forEach(markMediaDark);
  }

  return media;
}

["jestei-pool-02", "jestei-pool-05", "jestei-pool-07", "jestei-pool-09", "jestei-pool-24", "jestei-pool-25", "jestei-pool-26"].forEach((demoId) => {
  const demo = CV_TASK_DEMOS[demoId];

  if (!demo) {
    return;
  }

  markMediaDark(demo.previewMedia);
  demo.media?.forEach(markMediaDark);
  demo.cards?.forEach((card) => card.media?.forEach(markMediaDark));
});

const styx = (path) => `/src/lab/assets/projects/styx/${path}`;
const styxCampaignMedia = [
  image(styx("campaign-01.webp"), "Styx Jewels, кампейн 01"),
  image(styx("campaign-02.webp"), "Styx Jewels, кампейн 02"),
  image(styx("campaign-03.webp"), "Styx Jewels, кампейн 03"),
  image(styx("campaign-04.jpg"), "Styx Jewels, кампейн 04"),
  image(styx("campaign-05.jpg"), "Styx Jewels, кампейн 05"),
  image(styx("campaign-06.jpg"), "Styx Jewels, кампейн 06"),
  image(styx("campaign-07.webp"), "Styx Jewels, кампейн 07"),
  image(styx("campaign-08.webp"), "Styx Jewels, кампейн 08"),
  image(styx("campaign-09.webp"), "Styx Jewels, кампейн 09"),
  image(styx("campaign-10.jpg"), "Styx Jewels, кампейн 10"),
];
const styxPackagingMedia = [
  video(styx("box-animation-side.mp4"), "анимация упаковки сбоку"),
  video(styx("box-animation-top.mp4"), "анимация упаковки сверху"),
  darkImage(styx("styx-package-top.png"), "верх упаковки Styx Jewels"),
  darkImage(styx("styx-package-bottom.png"), "низ упаковки Styx Jewels"),
  image(styx("archive/legacy/bottom-photo.jpg"), "фотография упаковки Styx Jewels"),
  image(styx("archive/legacy/lid-cover-22-02.jpg"), "крышка упаковки Styx Jewels"),
];
const styxBrandMedia = [
  darkImage(styx("brand/styx-logo-white.png"), "белый логотип Styx Jewels"),
  video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels"),
  image(styx("1-16x9.jpg"), "визуальный язык Styx Jewels"),
  image(styx("bottom.jpg"), "предметный кадр Styx Jewels"),
];
const styxArchiveMedia = [
  image(styx("archive/legacy/asset-1-16x9.jpg"), "архивный материал Styx Jewels 01"),
  image(styx("archive/legacy/asset-1-09.jpg"), "архивный материал Styx Jewels 02"),
  image(styx("archive/legacy/asset-1-03.jpg"), "архивный материал Styx Jewels 03"),
  darkImage(styx("archive/legacy/asset-1-at-2x.png"), "графический макет Styx Jewels"),
  image(styx("archive/legacy/asset-2-02.jpg"), "архивный материал Styx Jewels 04"),
  image(styx("archive/legacy/asset-3-02.jpg"), "архивный материал Styx Jewels 05"),
  image(styx("archive/legacy/asset-4-08.jpg"), "архивный материал Styx Jewels 06"),
  darkImage(styx("archive/legacy/bottom-reference.png"), "референс нижней стороны упаковки"),
  darkImage(styx("archive/legacy/top-reference.png"), "референс верхней стороны упаковки"),
  darkImage(styx("archive/legacy/bottom-variant-8.png"), "вариант нижней стороны упаковки"),
];

function styxDemo(id, { title, preview, summary = preview, previewMedia, media, fileCount }) {
  CV_TASK_DEMOS[id] = {
    project: "Styx Jewels",
    title,
    preview,
    summary,
    previewMedia,
    media,
    cards: [],
    assetPath: "src/lab/assets/projects/styx",
    fileCount: fileCount ?? media.length,
  };
}

styxDemo("styx-brand-dna", {
  title: "разработал ДНК бренда: логотип и фирменный стиль",
  preview: "Логотип, мрачная предметность, плотная графика и общий визуальный язык бренда.",
  previewMedia: darkImage(styx("brand/styx-logo-white.png"), "белый логотип Styx Jewels"),
  media: [...styxBrandMedia, ...styxArchiveMedia.slice(0, 4)],
});

styxDemo("styx-visual-presentation", {
  title: "реализовал визуальную подачу",
  preview: "Собрал подачу бренда через видео, кампейн-кадры, предметность и фактуру.",
  previewMedia: video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels"),
  media: [video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels"), video(styx("basement-16x9.mp4"), "видео среды бренда"), ...styxCampaignMedia.slice(0, 6)],
});

styxDemo("styx-packaging", {
  title: "разработал дизайн подарочной упаковки",
  preview: "Упаковка как отдельный носитель: верх, низ, боковая пластика и видео-проверка объема.",
  previewMedia: darkImage(styx("styx-package-top.png"), "верх упаковки Styx Jewels"),
  media: styxPackagingMedia,
});

styxDemo("styx-business-cards", {
  title: "разработал дизайн визиток",
  preview: "Архивные графические материалы и носители, собранные в стилистике бренда.",
  previewMedia: darkImage(styx("archive/legacy/asset-1-at-2x.png"), "графический макет Styx Jewels"),
  media: styxArchiveMedia.slice(0, 6),
});

styxDemo("styx-booklets", {
  title: "разработал дизайн буклетов",
  preview: "Печатная подача Styx: развороты, ритм изображений, плотная готическая материальность.",
  previewMedia: image(styx("archive/legacy/asset-1-16x9.jpg"), "архивный материал Styx Jewels"),
  media: [...styxArchiveMedia.slice(0, 7), ...styxCampaignMedia.slice(0, 3)],
});

styxDemo("styx-certificate", {
  title: "разработал дизайн сертификата",
  preview: "Сертификат и близкие печатные носители в общей визуальной системе бренда.",
  previewMedia: darkImage(styx("archive/legacy/top-reference.png"), "референс верхней стороны упаковки"),
  media: [darkImage(styx("archive/legacy/top-reference.png"), "референс верхней стороны упаковки"), darkImage(styx("archive/legacy/bottom-reference.png"), "референс нижней стороны упаковки"), ...styxArchiveMedia.slice(1, 5)],
});

styxDemo("styx-social", {
  title: "создал дизайн для соцсетей",
  preview: "Кампейн-кадры и предметные сцены, из которых собиралась сетка публикаций.",
  previewMedia: image(styx("campaign-07.webp"), "Styx Jewels, кампейн 07"),
  media: styxCampaignMedia,
});

styxDemo("styx-ads", {
  title: "разработал дизайн рекламных публикаций",
  preview: "Материалы для рекламной подачи: кампейн, предметные кадры, брендовая фактура.",
  previewMedia: image(styx("campaign-09.webp"), "Styx Jewels, кампейн 09"),
  media: [...styxCampaignMedia.slice(2, 10), video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels")],
});

styxDemo("styx-installments-banners", {
  title: "разработал дизайн баннеров для Сплита и Долями",
  preview: "Баннерная подача на основе предметных кадров, упаковки и графики бренда.",
  previewMedia: image(styx("bottom.jpg"), "предметный кадр Styx Jewels"),
  media: [image(styx("bottom.jpg"), "предметный кадр Styx Jewels"), image(styx("1-16x9.jpg"), "визуальный язык Styx Jewels"), ...styxPackagingMedia.slice(2, 6)],
});

styxDemo("styx-shoot-style", {
  title: "придумал стилистику и концепцию брендовых съемок",
  preview: "Стилистика съемок: мрачная романтика, аналоговая плотность, украшения как артефакты.",
  previewMedia: image(styx("campaign-01.webp"), "Styx Jewels, кампейн 01"),
  media: [...styxCampaignMedia, video(styx("basement-16x9.mp4"), "видео среды бренда")],
});

styxDemo("styx-shoot-production", {
  title: "продюсировал съемки",
  preview: "Материалы кампейнов и видео среды: постановка, свет, фактура, контроль результата.",
  previewMedia: image(styx("campaign-03.webp"), "Styx Jewels, кампейн 03"),
  media: [video(styx("basement-16x9.mp4"), "видео среды бренда"), ...styxCampaignMedia.slice(0, 8)],
});

styxDemo("styx-campaign-photo", {
  title: "фотографировал кампейны",
  preview: "Серия фотографий Styx Jewels: украшения, кожа, металл, темный предметный тон.",
  previewMedia: image(styx("campaign-02.webp"), "Styx Jewels, кампейн 02"),
  media: styxCampaignMedia,
});

styxDemo("styx-mini-studio", {
  title: "помог организовать собственную мини-студию для каталожной съемки бренда",
  preview: "Каталожная и предметная база: кадры, свет, упаковка и повторяемая съемочная среда.",
  previewMedia: image(styx("bottom.jpg"), "предметный кадр Styx Jewels"),
  media: [image(styx("bottom.jpg"), "предметный кадр Styx Jewels"), image(styx("1-16x9.jpg"), "визуальный язык Styx Jewels"), ...styxCampaignMedia.slice(4, 10)],
});

styxDemo("styx-scanography", {
  title: "разработал концепцию сканографических анимаций для бренда и создавал их вручную при помощи сканера и принтера",
  preview: "Аналоговая часть бренда: ручная графика, сканер, принтер, плотный предметный образ.",
  previewMedia: video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels"),
  media: [video(styx("styx-visual-system-loop.mp4"), "видео визуальной системы Styx Jewels"), ...styxArchiveMedia, ...styxCampaignMedia.slice(0, 4)],
  fileCount: 15,
});

styxDemo("styx-retouch", {
  title: "ретушировал и стилизовывал кадры коллабораций и каталожных съемок",
  preview: "Финальная стилизация кадров: цвет, плотность, фактура и единый тон серии.",
  previewMedia: image(styx("campaign-08.webp"), "Styx Jewels, кампейн 08"),
  media: [...styxCampaignMedia.slice(5, 10), ...styxArchiveMedia.slice(4, 10)],
});

const jesteiLab = (path) => `/src/lab/assets/${path}`;
const jesteiBrand = (path) => `/src/lab/assets/brand/${path}`;
const jesteiProject = (path) => `/src/lab/assets/projects/jestei/${path}`;
const newsletterSources = [
  asset("../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 8.png"),
  asset("../../assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda/Section 9.png"),
];

CV_TASK_DEMOS["jestei-pool-25"] = {
  project: "Jestei Pool",
  title: "подобрал брендовый шрифт",
  preview: "Брендовый шрифт Jestei Pool — Druk Wide: широкий геометрический гротеск для плотной, музыкальной подачи.",
  summary: "Показываю Druk Wide как основу характера бренда: крупная геометрия, короткие сильные надписи и связка с интерфейсными материалами.",
  previewMedia: darkImage(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/druk-wide-preview.png"), "Druk Wide, широкий геометрический гротеск"),
  media: [
    darkImage(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/druk-wide-preview.png"), "Druk Wide, широкий геометрический гротеск"),
    darkImage(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Group 1171277123.png"), "пример Druk в системе Jestei Pool"),
    darkImage(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/Desktop - 152.png"), "пример брендового шрифта в интерфейсе"),
  ],
  cards: [],
  assetPath: "src/assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift",
  fileCount: 3,
};

CV_TASK_DEMOS["jestei-pool-24"].media = [
  logoInspector("3D-инспектор логотипа Jestei Pool", { minHeight: 620 }),
  ...CV_TASK_DEMOS["jestei-pool-24"].media,
];

CV_TASK_DEMOS["jestei-pool-26"].previewMedia = video(jesteiProject("colors/video-jestei-bg.mp4"), "видео цветовой системы Jestei Pool");
CV_TASK_DEMOS["jestei-pool-26"].media = [
  logoInspector("3D-превью логотипа в цветовых вариантах", { minHeight: 580 }),
  video(jesteiProject("colors/video-jestei-bg.mp4"), "видео цветовой системы Jestei Pool"),
  darkImage(jesteiProject("palette/jestei-palette-grid.png"), "палитра Jestei Pool"),
  darkImage(jesteiBrand("colors/Property 1=Record Pool.png"), "цветовая тема Record Pool"),
  darkImage(jesteiBrand("colors/Property 1=Event.png"), "цветовая тема Event"),
  darkImage(jesteiBrand("colors/Property 1=PRO.png"), "цветовая тема Pro"),
  darkImage(jesteiBrand("colors/Breakpoint=Desktop, Type=Default.png"), "цветовая система на desktop"),
  darkImage(jesteiBrand("colors/Breakpoint=Desktop, Type=Upgrade.png"), "цветовая система upgrade"),
  ...(CV_TASK_DEMOS["jestei-pool-26"].media ?? []),
];

CV_TASK_DEMOS["jestei-pool-05"].previewMedia = video(jesteiProject("media/video-jestei-bg.mp4"), "видео-превью лендинга Jestei Pool");
CV_TASK_DEMOS["jestei-pool-05"].media = [
  video(jesteiProject("media/video-jestei-bg.mp4"), "видео-превью лендинга Jestei Pool"),
  ...(CV_TASK_DEMOS["jestei-pool-05"].media ?? []),
];

CV_TASK_DEMOS["jestei-pool-premium-products"] = {
  project: "Jestei Pool",
  title: "сделал редизайн премиальных продуктов для ивент-диджеев",
  preview: "Премиальные продуктовые экраны: отдельная подача Pro/Event и визуальная связь с общей айдентикой.",
  summary: "Собрал премиальные продуктовые состояния вокруг разных аудиторий: Pro, Event, Record Pool. В сайдбаре добавлен 3D-инспектор логотипа, потому что эти продукты держатся на общей фирменной системе.",
  previewMedia: darkImage(jesteiBrand("colors/Property 1=PRO.png"), "премиальная тема Pro"),
  media: [
    logoInspector("3D-превью логотипа для продуктовой линейки", { minHeight: 560, variant: "pro-blue" }),
    darkImage(jesteiBrand("colors/Property 1=PRO.png"), "премиальная тема Pro"),
    darkImage(jesteiBrand("colors/Property 1=Event.png"), "премиальная тема Event"),
    darkImage(jesteiBrand("colors/Breakpoint=Desktop, Type=Upgrade.png"), "upgrade-экран"),
    darkImage(jesteiBrand("filter/Type=Pro, Size=1540, Filtered=True, Theme=Default.png"), "фильтр Pro"),
    darkImage(jesteiProject("macbook/screen/screen-ui-current.png"), "продуктовый экран на ноутбуке"),
  ],
  cards: [],
  assetPath: "src/lab/assets/brand",
  fileCount: 6,
};

CV_TASK_DEMOS["jestei-pool-audience-colors"] = {
  project: "Jestei Pool",
  title: "придумал как при помощи цветов разделять продукты и аудитории",
  preview: "Разные аудитории читаются через цветовые темы: Record Pool, Event, Pro и отдельные акцентные состояния.",
  summary: "Цвет здесь работает как навигация по продуктам и аудиториям: пользователь быстрее понимает, где Record Pool, где Event, где Pro. 3D-инспектор показывает, как тот же принцип переносится на логотип.",
  previewMedia: video(jesteiProject("colors/video-jestei-bg.mp4"), "видео цветовых тем Jestei Pool"),
  media: [
    logoInspector("3D-превью логотипа в цветовых вариантах", { minHeight: 560, variant: "event-green" }),
    video(jesteiProject("colors/video-jestei-bg.mp4"), "видео цветовых тем Jestei Pool"),
    darkImage(jesteiBrand("colors/Property 1=Record Pool.png"), "Record Pool"),
    darkImage(jesteiBrand("colors/Property 1=Event.png"), "Event"),
    darkImage(jesteiBrand("colors/Property 1=PRO.png"), "Pro"),
    darkImage(jesteiBrand("colors/Property 1=Variant4.png"), "дополнительная цветовая тема"),
    darkImage(jesteiProject("colors/source-exports/blue-letters-reference.png"), "синий акцент"),
    darkImage(jesteiProject("colors/source-exports/event-reference.png"), "event-референс"),
  ],
  cards: [],
  assetPath: "src/lab/assets/brand/colors",
  fileCount: 8,
};

CV_TASK_DEMOS["jestei-pool-brand-style"] = {
  project: "Jestei Pool",
  title: "разработал фирменный стиль",
  preview: "Фирменный стиль Jestei Pool: логотип, Druk Wide, цвета, промо-форматы и интерфейсная графика.",
  summary: "Собрал фирменную систему как набор рабочих носителей: 3D-логотип, шрифт, цвета, промо-форматы и интерфейсные элементы.",
  previewMedia: logoInspector("3D-превью логотипа Jestei Pool", { minHeight: 300 }),
  media: [
    logoInspector("3D-превью логотипа Jestei Pool", { minHeight: 620 }),
    darkImage(asset("../../assets/cv/chip-content/01-jestei-pool/25-podobral-brendovyy-shrift/druk-wide-preview.png"), "Druk Wide"),
    darkImage(jesteiProject("palette/jestei-palette-grid.png"), "палитра Jestei Pool"),
    darkImage(jesteiBrand("fin/Logo-spec1.png"), "спецификация логотипа"),
    darkImage(jesteiBrand("fin/Logo-spec2.png"), "спецификация логотипа 2"),
    darkImage(jesteiBrand("fin/promo-formats/vk-16x9.png"), "промо-формат VK 16x9"),
    darkImage(jesteiBrand("fin/promo-formats/tg-post-1.png"), "промо-пост"),
  ],
  cards: [],
  assetPath: "src/lab/assets/brand",
  fileCount: 7,
};

CV_TASK_DEMOS["jestei-pool-newsletters"] = {
  project: "Jestei Pool",
  title: "разработал дизайн для рассылок бренда",
  preview: "Интерактивный canvas для просмотра двух длинных макетов рассылок рядом.",
  summary: "Подключил отдельный canvas-модуль для рассылок: внутри можно двигать и приближать длинные макеты, чтобы смотреть структуру письма не как статичную миниатюру.",
  previewMedia: newsletterCanvas(newsletterSources, "canvas рассылок Jestei Pool", { minHeight: 300 }),
  media: [
    newsletterCanvas(newsletterSources, "canvas рассылок Jestei Pool", { minHeight: 720 }),
    darkImage(newsletterSources[0], "рассылка Jestei Pool, секция 8"),
    darkImage(newsletterSources[1], "рассылка Jestei Pool, секция 9"),
  ],
  cards: [],
  assetPath: "src/assets/cv/chip-content/01-jestei-pool/37-razrabotal-dizayn-dlya-rassylok-brenda",
  fileCount: 2,
};

CV_TASK_DEMOS["styx-packaging"].previewMedia = video(styx("box-animation-side.mp4"), "анимация упаковки Styx Jewels");
