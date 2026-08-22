import type { EntityBase } from "../../types/entity.ts";

export interface IndustryData extends EntityBase {}

export const industries = [
  {
    id: "music",
    name: "Музыка",
  },

  {
    id: "fashion",
    name: "Fashion",
  },
  {
    id: "arts",
    name: "Искусство",
  },
  {
    id: "landscape-design",
    name: "Ландшафтный дизайн и озеленение",
  },
  {
    id: "video-production",
    name: "Видео-продакшен",
  },
  {
    id: "jewelry",
    name: "Ювелирная индустрия",
  },

  {
    id: "media",
    name: "Медиа",
  },

  {
    id: "publishing",
    name: "Издательское дело",
  },

  {
    id: "film",
    name: "Кино и видеопродакшн",
  },

  {
    id: "advertising",
    name: "Реклама",
  },

  {
    id: "events",
    name: "Ивенты",
  },

  {
    id: "technology",
    name: "Technology",
  },

  {
    id: "ecommerce",
    name: "E-commerce",
  },

  {
    id: "beauty",
    name: "Beauty",
  },

  {
    id: "culture",
    name: "Культура",
  },

  {
    id: "education",
    name: "Образование",
  },

  {
    id: "creative-production",
    name: "Креативный продакшн",
  },

  {
    id: "advertising-production",
    name: "Рекламный продакшн",
  },

  {
    id: "photo-production",
    name: "Фото- и контент-продакшн",
  },

  {
    id: "performing-arts",
    name: "Театр и исполнительские искусства",
  },

  {
    id: "retail",
    name: "Ритейл",
  },

  {
    id: "academic-research",
    name: "Наука и исследования",
  },

  {
    id: "linguistics",
    name: "Лингвистика",
  },

  {
    id: "news",
    name: "Новости",
  },
] as const satisfies readonly IndustryData[];

export type Industry = (typeof industries)[number];

export type IndustryId = Industry["id"];
