export interface ServiceProof {
  label: string;
  href: string;
}

export interface MainServiceCard {
  id: string;
  title: string;
  result: string;
  deliverables: readonly string[];
  proof?: ServiceProof;
}

export interface MainServiceGroup {
  id: "design" | "3d" | "ai" | "code" | "music";
  title: string;
  cards: readonly MainServiceCard[];
}

export interface AllServiceSection {
  title: string;
  items: readonly string[];
}

export interface AllServiceGroup {
  id: MainServiceGroup["id"];
  title: string;
  sections: readonly AllServiceSection[];
}

export const mainServiceGroups = [
  {
    id: "design",
    title: "Design",
    cards: [
      {
        id: "brand-identity-rebranding",
        title: "Brand Identity & Rebranding",
        result: "целостная айдентика, которую можно последовательно применять в digital, печати, продукте и коммуникациях без визуального расползания.",
        deliverables: [
          "логотип или обновлённая система знака",
          "цветовая и типографическая система",
          "ключевые композиционные и графические принципы",
          "набор основных бренд-носителей и шаблонов",
          "style guide / brandbook",
          "набор материалов для перехода со старой айдентики при ребрендинге",
        ],
        proof: { label: "Jestei Pool", href: "/work/jestei-pool/" },
      },
      {
        id: "packaging-design",
        title: "Packaging Design",
        result: "упаковка с понятной иерархией, узнаваемым визуальным характером и готовыми материалами для производства и презентации товара.",
        deliverables: [
          "концепция упаковки",
          "дизайн лицевой, оборотной и боковых зон",
          "компоновка на предоставленной развёртке / dieline",
          "система маркировки, текста и обязательной информации",
          "print-ready файлы",
          "mockup или 3D-визуализация для презентации",
        ],
        proof: { label: "Styx Jewel", href: "/work/styx/" },
      },
      {
        id: "website-landing-design",
        title: "Website & Landing Design",
        result: "адаптивный сайт или лендинг с ясной структурой, сильной визуальной подачей и интерфейсом, который можно передать в разработку без повторного проектирования.",
        deliverables: [
          "структура страниц и ключевых пользовательских сценариев",
          "desktop и mobile макеты",
          "состояния основных интерфейсных элементов",
          "интерактивный прототип ключевых переходов",
          "набор reusable UI-компонентов",
          "handoff-материалы для разработки",
        ],
        proof: { label: "looksawful.ru", href: "/" },
      },
      {
        id: "design-systems",
        title: "Design Systems",
        result: "масштабируемая система интерфейсных правил и компонентов, которая сокращает расхождения между дизайном и разработкой и ускоряет выпуск новых экранов.",
        deliverables: [
          "библиотека компонентов",
          "design tokens",
          "варианты, состояния и responsive-правила компонентов",
          "Figma library / UI kit",
          "документация по использованию",
          "спецификация для внедрения в код или существующую component library",
        ],
        proof: { label: "looksawful.ru", href: "/" },
      },
      {
        id: "product-jewelry-retouching",
        title: "Product & Jewelry Retouching",
        result: "чистые коммерческие изображения с точной передачей формы, материала и цвета, готовые для e-commerce, рекламы и печати.",
        deliverables: [
          "очищенные и выровненные master-изображения",
          "коррекция цвета и материалов",
          "работа с бликами, отражениями и микродефектами",
          "compositing / background variants при необходимости",
          "e-commerce crops и форматы",
          "финальные web/print exports",
        ],
      },
    ],
  },
  {
    id: "3d",
    title: "3D",
    cards: [
      {
        id: "3d-product-visualization",
        title: "3D Product Visualization",
        result: "фотореалистичные изображения продукта для рекламы, e-commerce, презентации и запуска ещё до или вместо полноценной фотосъёмки.",
        deliverables: [
          "3D-модель продукта",
          "материалы и look development",
          "финальные студийные рендеры",
          "набор согласованных ракурсов и detail shots",
          "product animation при включении в scope",
          "web-ready GLB/glTF при включении в scope",
        ],
        proof: { label: "AWFUL STUDIO", href: "/work/awful-studio/" },
      },
      {
        id: "interactive-3d-webgl",
        title: "Interactive 3D / Three.js / WebGL",
        result: "интерактивная 3D-сцена или продуктовый web-опыт, который работает прямо в браузере и остаётся частью обычного сайта, а не отдельной демо-игрушкой.",
        deliverables: [
          "оптимизированная 3D-сцена или web-ready asset",
          "Three.js/WebGL implementation",
          "интерактивные camera/object states",
          "responsive interaction behaviour",
          "performance fallback для слабых устройств",
          "integration-ready build для существующего сайта",
        ],
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    cards: [
      {
        id: "ai-product-visuals",
        title: "AI Product Visuals",
        result: "коммерческие изображения продукта без полноценной съёмочной смены, с контролем формы, упаковки, материалов и визуальной среды.",
        deliverables: [
          "hero product images",
          "environment / lifestyle variants",
          "product placement и background variants",
          "рекламные и e-commerce crops",
          "cleanup и retouch финальных изображений",
          "экспортный набор под согласованные каналы",
        ],
      },
      {
        id: "ai-fashion-virtual-models",
        title: "AI Fashion & Virtual Models",
        result: "последовательная серия fashion/beauty-изображений с контролируемой моделью, стилизацией и визуальным языком кампании.",
        deliverables: [
          "consistent virtual model / character set",
          "серия образов и garment/look scenes",
          "набор согласованных поз и ракурсов",
          "campaign / editorial compositions",
          "social и advertising crops",
          "retouched final images",
        ],
      },
      {
        id: "ai-advertising-campaign-visuals",
        title: "AI Advertising & Campaign Visuals",
        result: "готовая система рекламных key visuals и адаптаций для запуска кампании, а не набор несвязанных генераций.",
        deliverables: [
          "ключевая визуальная концепция",
          "master key visual",
          "серия рекламных вариаций",
          "social / display / campaign adaptations",
          "composited и retouched finals",
          "source assets для дальнейшего motion или layout production",
        ],
        proof: { label: "Jestei Pool", href: "/work/jestei-pool/" },
      },
      {
        id: "ai-tools-workflow-automation",
        title: "AI Tools & Workflow Automation",
        result: "рабочий AI-процесс, встроенный в существующую команду и рутину, который сокращает ручные операции и делает результат воспроизводимым.",
        deliverables: [
          "схема и конфигурация AI workflow",
          "выбранный model/tool stack",
          "reusable presets / assistants / production templates",
          "автоматизированный pipeline для целевой задачи",
          "документация по использованию",
          "обучение команды работе с настроенным процессом",
        ],
        proof: { label: "Jestei Pool", href: "/work/jestei-pool/" },
      },
    ],
  },
  {
    id: "code",
    title: "Code",
    cards: [
      {
        id: "frontend-development-fixes",
        title: "Frontend Development & Fixes",
        result: "рабочий адаптивный интерфейс или исправленный frontend без обязательного полного редизайна продукта.",
        deliverables: [
          "responsive frontend implementation",
          "Figma-to-code implementation при наличии макетов",
          "UI / CSS / JavaScript bug fixes",
          "web-animation integration",
          "performance и accessibility fixes в согласованном scope",
          "production-ready code для интеграции или deploy",
        ],
        proof: { label: "looksawful.ru", href: "/" },
      },
      {
        id: "creative-plugins",
        title: "Creative Plugins",
        result: "специализированный plugin/add-on внутри рабочего creative-софта, который превращает повторяемую ручную операцию в короткое предсказуемое действие.",
        deliverables: [
          "рабочий plugin/add-on для согласованной платформы",
          "команды или UI для целевого workflow",
          "настройки / presets, если они нужны задаче",
          "integration с API или файлами при необходимости",
          "release package / source package",
          "короткая документация по установке и использованию",
        ],
        proof: { label: "AWFUL STUDIO", href: "/work/awful-studio/" },
      },
      {
        id: "workflow-automation",
        title: "Workflow Automation",
        result: "меньше ручных повторяющихся операций в дизайн- и media-production без внедрения лишней платформы или сложной инфраструктуры.",
        deliverables: [
          "script или automation для конкретной операции",
          "batch-processing workflow",
          "export / naming / packaging pipeline",
          "asset generator или converter при необходимости",
          "минимальная конфигурация для рабочей среды клиента",
          "инструкция по запуску и поддержке",
        ],
        proof: { label: "AWFUL STUDIO", href: "/work/awful-studio/" },
      },
    ],
  },
  {
    id: "music",
    title: "Music",
    cards: [
      {
        id: "artist-visual-production",
        title: "Artist Visual Production",
        result: "единая визуальная система артиста для релиза, PR, стримингов, соцсетей и концертной коммуникации вместо набора несвязанных материалов от разных подрядчиков.",
        deliverables: [
          "press / promo photography",
          "artist identity и визуальные правила",
          "cover / release artwork",
          "promo и social graphics",
          "merch artwork",
          "motion или AI extensions по задаче релиза",
        ],
        proof: { label: "Shootings", href: "/shootings/" },
      },
    ],
  },
] as const satisfies readonly MainServiceGroup[];

export const fastGraphicDesign = {
  id: "fast-graphic-design",
  title: "Fast Graphic Design",
  result: "быстро закрыть небольшую конкретную графическую задачу без входа в большой branding или campaign scope.",
  items: [
    "poster / афиша",
    "brochure / booklet",
    "catalog",
    "merch graphics",
    "social / advertising creatives",
    "album cover",
    "adaptations / resizing",
    "prepress",
  ],
} as const;

export const allServiceGroups = [
  {
    id: "design",
    title: "Design",
    sections: [
      {
        title: "Графический дизайн и айдентика",
        items: [
          "Logo Design / разработка логотипа",
          "Logo Redesign / обновление логотипа",
          "Brand Identity Design / фирменный стиль и айдентика",
          "Rebranding / ребрендинг",
          "Brand Guidelines / брендбук и гайд",
          "Packaging Design / дизайн упаковки",
          "Label Design / дизайн этикетки",
          "Print Design / полиграфия",
          "Catalog / Brochure Design",
          "Book Design / дизайн книги",
          "Print Layout / многостраничная вёрстка",
          "Poster / Афиша",
          "Outdoor Advertising Design",
          "Social Media Design",
          "Advertising Creatives",
          "Email Design",
          "Product Card Design",
          "Album / EP / Single Cover Design",
          "Music Visual Identity",
          "Merch Design",
          "Lettering / Custom Typography",
          "Infographic Design",
          "Icon Design / Icon Set",
          "Prepress / подготовка к печати",
          "Design Adaptation / Resize",
          "Mockup / 2D Visualisation",
        ],
      },
      {
        title: "Product / Jewelry / Commercial Retouching",
        items: [
          "Product Retouching",
          "Jewelry Retouching",
          "E-commerce Retouching",
          "Commercial / Advertising Retouching",
          "Photo Compositing",
          "Portrait / Beauty Retouching",
          "Fashion / Editorial Retouching",
        ],
      },
      {
        title: "Concept Design, Illustration, Characters",
        items: [
          "Character Concept Design",
          "Mascot Design",
          "Prop Concept Design",
          "Environment Concept Design",
          "Object Design",
          "Digital Illustration",
          "Editorial Illustration",
          "Mixed-media Illustration",
          "Commercial Illustration",
          "Scanography",
          "Scanography Animation",
        ],
      },
      {
        title: "UI/UX, цифровые продукты и дизайн-системы",
        items: [
          "Website Design",
          "Landing Page Design",
          "Web Visual Design",
          "Website Redesign",
          "Web App Design",
          "SaaS UI/UX Design",
          "Dashboard Design",
          "Admin Panel Design",
          "Mobile App UI/UX Design",
          "E-commerce UI Design",
          "UX/UI Audit",
          "Prototype / прототипирование интерфейса",
          "Design System",
          "UI Kit",
          "Component Library Design",
          "Design Tokens",
        ],
      },
      {
        title: "Редактура текстов для сайтов",
        items: [
          "Website Content Proofreading",
          "Website Content Editing",
          "Website Copy Editing",
          "UX Writing / Microcopy Editing",
          "Terminology / Style Alignment",
        ],
      },
      {
        title: "Motion, Video, After Effects",
        items: [
          "Motion Graphics",
          "Logo Animation",
          "UI Animation",
          "Lottie Animation",
          "Animated Ads",
          "Promo Video",
          "Product Demo Video",
          "Video Editing",
          "Video Compositing & Cleanup",
          "After Effects Template Editing",
        ],
      },
      {
        title: "Generative Graphics",
        items: ["Generative Art"],
      },
    ],
  },
  {
    id: "3d",
    title: "3D",
    sections: [
      {
        title: "3D Product Visualization и 3D",
        items: [
          "3D Modeling",
          "3D Product Modeling",
          "3D Product Visualization",
          "3D Advertising Visualization",
          "3D Product Animation",
          "3D Mockup",
          "3D Logo",
          "Web-ready 3D Model",
          "Architectural Visualization",
        ],
      },
      {
        title: "3D Environments",
        items: [
          "3D Environment Design",
          "3D Environment Modeling",
          "3D Location Modeling",
          "Environment Props",
          "3D Scene Assembly",
          "Environment Visualization",
          "Web-ready Environment Optimization",
        ],
      },
      {
        title: "Three.js / WebGL / Interactive 3D",
        items: [
          "Interactive 3D Website",
          "Interactive 3D Landing Page",
          "Product Configurator",
          "Interactive Product Visual",
          "WebGL Animation",
          "Realtime 3D for Web",
        ],
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    sections: [
      {
        title: "AI Commercial Visual Production",
        items: [
          "AI Product Photography",
          "AI Fashion Photography",
          "Virtual Model Photography",
          "AI Lifestyle Imagery",
          "AI Product Placement",
          "AI Advertising Creatives",
          "AI Fashion / Beauty Campaign",
          "AI Editorial Imagery",
          "AI Product Launch Visuals",
          "AI Image Editing & Retouching",
          "Consistent Character / Model Generation",
          "Background / Environment Generation",
        ],
      },
      {
        title: "AI Video",
        items: [
          "AI Video Generation",
          "AI Advertising Video",
          "AI Fashion Video",
          "AI Product Video",
          "AI Character Video",
          "AI Video Editing",
          "AI Compositing",
          "Image-to-Video",
        ],
      },
      {
        title: "AI Tools, Workflow, Team Enablement",
        items: [
          "AI Consulting for Creative Workflow",
          "AI Tool Setup",
          "AI Workflow Development",
          "Team AI Training",
          "AI Workflow Implementation",
          "AI Visual Task Automation",
          "Custom AI Assistant / Tool",
          "Custom GPT / LLM Tool",
          "AI Content Processing Tool",
          "AI Design Tool",
          "AI Routine Automation",
        ],
      },
    ],
  },
  {
    id: "code",
    title: "Code",
    sections: [
      {
        title: "Frontend, сайты, интеграции и CMS",
        items: [
          "Landing Page Development",
          "Website Development",
          "Website Design & Development",
          "Figma to HTML/CSS",
          "Figma to React",
          "React Frontend Development",
          "UI Components / Component Library Development",
          "Frontend Bug Fixing",
          "Responsive Fixes",
          "Web Animation Implementation",
          "Frontend Performance Optimization",
          "Website Rebuild / Migration",
          "CMS Integration",
          "Headless CMS Integration",
          "API Integration",
          "Supabase Backend Setup",
          "Auth / Database / Storage Integration",
        ],
      },
      {
        title: "Аудиты сайта, Technical SEO, Accessibility",
        items: [
          "Technical SEO Audit",
          "Technical SEO Fixes",
          "On-page SEO",
          "Schema / Structured Data Implementation",
          "Core Web Vitals / Site Speed Optimization",
          "Accessibility Audit",
          "Accessibility Remediation",
          "Performance Audit",
          "Frontend Code Audit",
          "Responsive Audit",
        ],
      },
      {
        title: "Plugins, Extensions, Creative Automation",
        items: [
          "Figma Plugin Development",
          "Photoshop Plugin / Script",
          "After Effects Script / Plugin",
          "Blender Add-on / Script",
          "Browser Extension Development",
          "Plugin Maintenance / Debugging",
          "Creative Workflow Automation",
          "Batch Processing",
          "Asset Generator",
          "Export Automation",
          "File Conversion Pipeline",
          "Internal Tools for Design Teams",
        ],
      },
      {
        title: "Creative Coding",
        items: ["Creative Coding", "Interactive Generative Graphics"],
      },
    ],
  },
  {
    id: "music",
    title: "Music",
    sections: [
      {
        title: "Съёмки музыкантов",
        items: [
          "Musician Press Photos",
          "Band Promo Photography",
          "Artist Promo Photography",
          "Musician Branding Photography",
          "Concert / Live Music Photography",
        ],
      },
      {
        title: "Artist Visual Production",
        items: [
          "Artist Visual Identity",
          "Release Visual Package",
          "Artist Campaign Visuals",
          "Music Cover + Motion Extension",
        ],
      },
    ],
  },
] as const satisfies readonly AllServiceGroup[];
