import type { CollectionData } from "../../types/collection.ts";

export const collections = [
  {
    id: "music-photography",
    name: "Музыкальная фотография",
    displayName: "Shootings",
    visibility: "public",
    summary:
      "Делаю дизайн обложек для российских музыкантов, продюсирую и снимаю контент-съёмки для музыкальных лейблов и для брендов одежды и публикую творческие работы в российских и европейских fashion- и арт-изданиях с 2017 года.",
    description:
      "Кадры ниже — мои собственные фотографии, съёмки, которые я продюсировал, экспериментальные микс-медиа, которые я делал из собственных и чужих фотографий на заказ и дизайн, который делал я и который делали другие люди с моими фотографиями.",
    primaryRoleId: "photographer",
    roleIds: ["photographer", "digital-artist", "producer"],
    workAreaIds: ["photography"],
  },
  {
    id: "fashion-photography",
    name: "Fashion-фотография",
    visibility: "hidden",
    workAreaIds: ["photography"],
  },
  {
    id: "product-photography",
    name: "Предметная фотография",
    visibility: "hidden",
    workAreaIds: ["photography"],
  },
  {
    id: "interfaces",
    name: "Интерфейсы",
    visibility: "hidden",
    workAreaIds: ["ui", "product-design"],
  },
  {
    id: "design",
    name: "Дизайн",
    visibility: "hidden",
    workAreaIds: ["graphic-design"],
  },
  {
    id: "production",
    name: "Продюсирование",
    visibility: "hidden",
    workAreaIds: ["production"],
  },
  {
    id: "scanography",
    name: "Сканография",
    visibility: "hidden",
  },
  {
    id: "motion",
    name: "Motion",
    visibility: "hidden",
    workAreaIds: ["motion"],
  },
  {
    id: "logos",
    name: "Логотипы",
    visibility: "hidden",
    workAreaIds: ["identity", "graphic-design"],
  },
  {
    id: "pet-projects",
    name: "Pet Projects",
    visibility: "hidden",
  },
] as const satisfies readonly CollectionData[];

export type Collection = (typeof collections)[number];
export type CollectionId = Collection["id"];
