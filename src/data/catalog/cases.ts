import type { CaseData } from "../../types/case.ts";

export const cases = [
  {
    id: "jestei-pool",
    name: "Jestei Pool",
    visibility: "public",
    date: "2024–2026",
    clientIds: ["jestei-pool"],
    engagementIds: ["jestei-pool-2024-2026"],
    summary:
      "Я сформировал новый визуальный язык главного российского диджейского пула, разработал UX/UI-стратегию для core-продуктов и руководил всей командой дизайнеров проекта в течение двух с половиной лет.",
    description:
      "Возглавил дизайн-направление музыкального подписочного сервиса для диджеев, саунд-продюсеров и артистов. Пересобрал визуальный язык, интерфейс, дизайн-систему, тарифы, пейволлы, поиск, фильтрацию, Event-направление, продуктовую коммуникацию и систему производства графики. Сократил путь к контенту с 6 до 2 шагов, подготовил BASIC и PRO к выходу на американский рынок и поддержал повышение стоимости подписок без деградации клиентской базы.",
    primaryRoleId: "art-director",
    roleIds: ["art-director"],
    engagementTypeIds: ["in-house", "embedded"],
    industryIds: ["music", "technology"],
  },
  {
    id: "styx",
    name: "Styx Jewel",
    visibility: "public",
    date: "2021–2025",
    clientIds: ["styx-jewel"],
    engagementIds: ["styx-jewel-2021-2025"],
    summary:
      "Возглавил комплексную работу над визуальной системой нишевого московского бренда украшений, аксессуаров и одежды, вдохновлённого готической романтикой и лавкрафтовским ужасом.",
    description:
      "Сформировал ДНК и визуальную систему бренда украшений, аксессуаров и одежды: разработал логотип, фирменный стиль, упаковку, печатные материалы, рекламную графику, каталоги, лукбуки и кампейны. Продюсировал и снимал брендовые съёмки, помог организовать собственную мини-студию и развил экспериментальное направление на основе сканографии и покадровой ручной анимации.",
    primaryRoleId: "designer",
    roleIds: ["designer", "digital-artist", "graphic-designer", "producer", "photographer"],
    engagementTypeIds: ["freelance", "long-term-client", "brand-side"],
    industryIds: ["jewelry", "fashion", "ecommerce", "photo-production", "arts"],
  },
  {
    id: "sensetique",
    name: "Sensetique",
    visibility: "public",
    date: "2016–2018",
    engagementIds: ["sensetique-2016-2018"],
    summary:
      "Занимался запуском, управлением, продюсированием съёмок и организацией команды московской фотостудии и продакшн для моды, рекламы и визуального контента.",
    description:
      "Создал и развивал фото- и видеопродакшн полного цикла и коммерческую fashion-фотостудию площадью 300 м² с тремя съёмочными залами. Руководил запуском площадки, продажами, тендерами и командой; отвечал за полный цикл производства визуального контента: от концепции, мудборда, кастинга, примерок, локаций, смет и документов до съёмки, постпродакшна, печатных материалов, сайтов и рекламной коммуникации.",
    primaryRoleId: "founder",
    roleIds: ["founder", "producer"],
    engagementTypeIds: ["owned", "self-initiated"],
    industryIds: [
      "photo-production",
      "fashion",
      "advertising",
      "video-production",
      "beauty",
      "ecommerce",
      "creative-production",
    ],
  },
] as const satisfies readonly CaseData[];

export type Case = (typeof cases)[number];
export type CaseId = Case["id"];
