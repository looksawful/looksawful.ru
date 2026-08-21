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
    id: "jewelry",
    name: "Ювелирная индустрия",
  },

  {
    id: "media",
    name: "Медиа",
  },ы

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
] as const satisfies readonly IndustryData[];

export type Industry = (typeof industries)[number];

export type IndustryId = Industry["id"];
