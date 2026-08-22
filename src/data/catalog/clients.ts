import type { ClientData } from "../../types/client.ts";

export const clients = [
  /* ==================================================
     Logo wall clients
     ================================================== */

  {
    id: "kursovoy",
    name: "KURSOVOY",
    industryIds: ["retail", "fashion"],
  },
  {
    id: "players-club",
    name: "PLAYERS CLUB",
  },
  {
    id: "jestei-pool",
    name: "Jestei Pool",
    description: "Музыкальный сервис для диджеев.",
    industryIds: ["music", "technology"],
  },
  {
    id: "lyve-moscow",
    name: "LYVÈ Moscow",
    description: "Студия озеленения и ландшафтного дизайна.",
    industryIds: ["landscape-design"],
  },
  {
    id: "styx-jewel",
    name: "Styx Jewel",
    description:
      "Московский бренд украшений, аксессуаров и одежды, вдохновлённый готической романтикой.",
    industryIds: ["jewelry", "fashion", "ecommerce"],
  },
  {
    id: "illumihand",
    name: "illumihand",
    description: "Бренд футболок с Камчатки.",
    industryIds: ["fashion"],
  },
  {
    id: "vk-music",
    name: "VK Музыка",
    industryIds: ["music", "media", "technology"],
  },
  {
    id: "48-jewelry",
    name: "48 Jewelry",
    industryIds: ["jewelry"],
  },
  {
    id: "second-friends-store",
    name: "Second Friends Store",
    industryIds: ["fashion", "retail", "ecommerce"],
  },
  {
    id: "li-ne-agency",
    name: "LI-NE Agency",
    description: "Продакшн-агентство в сфере моды, рекламы и медиа.",
    industryIds: ["advertising-production", "creative-production", "fashion"],
  },
  {
    id: "moch-fashn",
    name: "Moch Fashn",
    industryIds: ["fashion"],
  },
  {
    id: "mad-cow-films",
    name: "Mad Cow Films",
    description: "Международный рекламный продакшн с офисами в Лондоне и Москве.",
    industryIds: ["advertising-production", "film", "advertising"],
  },
  {
    id: "moskovskie-novosti",
    name: "Газета «Московские Новости»",
    description: "Ежедневная городская общественно-политическая газета о Москве.",
    industryIds: ["news", "media", "publishing"],
  },
  {
    id: "progress-tradition",
    name: "Прогресс-Традиция",
    description:
      "Российское издательство переводной, гуманитарной, художественной и образовательной литературы. Компания выпускает книги и работает с полным издательским циклом: текстом, структурой, редакционной подготовкой, иллюстрациями, вёрсткой и подготовкой материалов к печати.",
    industryIds: ["publishing"],
  },
  {
    id: "puma",
    name: "PUMA",
    industryIds: ["fashion", "retail", "ecommerce"],
  },
  {
    id: "buro-24-7",
    name: "BURO 24/7",
    industryIds: ["media", "publishing", "fashion"],
  },
  {
    id: "channel-one",
    name: "Первый канал",
    industryIds: ["media", "film"],
  },
  {
    id: "lenfilm",
    name: "Ленфильм",
    industryIds: ["film", "culture"],
  },
  {
    id: "stereotactic",
    name: "STEREOTACTIC",
    industryIds: ["creative-production", "advertising-production"],
  },
  {
    id: "kaltblut",
    name: "KALTBLUT",
    industryIds: ["media", "publishing", "fashion"],
  },
  {
    id: "s-and-s",
    name: "S&S",
    description:
      "Бренд стильных боди и нижнего белья с акцентом на выразительный силуэт, женственность и современную подачу.",
    industryIds: ["fashion"],
  },
  {
    id: "offmi",
    name: "OFFMi",
  },
  {
    id: "evasha",
    name: "EVASHA",
    industryIds: ["music"],
  },
  {
    id: "inna-honour",
    name: "Inna Honour",
    industryIds: ["fashion"],
  },
  {
    id: "flashin",
    name: "FLASHIN",
  },
  {
    id: "kislak",
    name: "Ki$lak",
    industryIds: ["music"],
  },
  {
    id: "dava",
    name: "DAVA",
    industryIds: ["music"],
  },
  {
    id: "affa-media",
    name: "AFFA MEDIA",
    industryIds: ["media"],
  },
  {
    id: "vinne",
    name: "VINNE",
  },

  /* ==================================================
     Other known clients and organisations
     ================================================== */

  {
    id: "olovo-moscow",
    name: "Olovo Moscow",
    industryIds: ["fashion"],
  },
  {
    id: "sergei-soroka",
    name: "Sergei Soroka",
    industryIds: ["fashion"],
  },
  {
    id: "theater-o",
    name: "Театр «О»",
    industryIds: ["performing-arts", "culture"],
  },
  {
    id: "obladaet",
    name: "Obladaet",
    industryIds: ["music"],
  },
  {
    id: "igguana",
    name: "Igguana",
    industryIds: ["music"],
  },
  {
    id: "esmi",
    name: "ESMI",
    industryIds: ["music"],
  },
  {
    id: "hypression",
    name: "HYPRESSION",
    industryIds: ["music"],
  },
  {
    id: "ofelia",
    name: "Ofelia",
    industryIds: ["music"],
  },
  {
    id: "krasota-dress",
    name: "Krasota Dress",
    industryIds: ["fashion"],
  },
  {
    id: "mimi-moscow",
    name: "MiMi Moscow Jewelry",
    industryIds: ["jewelry"],
  },
  {
    id: "berry-agency",
    name: "Berry Agency",
    description:
      "Московское модельное агентство, которое занимается подбором моделей, организацией кастингов, созданием модельных портфолио, а также проведением фото- и видеосъёмок.",
    industryIds: ["creative-production", "advertising-production"],
  },
  {
    id: "institute-linguistics-ras",
    name: "Институт языкознания РАН",
    industryIds: ["academic-research", "linguistics"],
  },
  {
    id: "ria-novosti",
    name: "РИА Новости",
    industryIds: ["news", "media"],
  },
  {
    id: "gac-motors",
    name: "GAC Motors",
  },
  {
    id: "vanish",
    name: "Vanish",
  },
  {
    id: "detsky-mir",
    name: "Детский мир",
    industryIds: ["retail", "ecommerce"],
  },
  {
    id: "h-and-m",
    name: "H&M",
    industryIds: ["fashion", "retail", "ecommerce"],
  },
  {
    id: "chapurin",
    name: "Chapurin",
    industryIds: ["fashion"],
  },
  {
    id: "evident-things",
    name: "Evident Things",
  },
] as const satisfies readonly ClientData[];

export type Client = (typeof clients)[number];
export type ClientId = Client["id"];
