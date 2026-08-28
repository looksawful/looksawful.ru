import type { ProjectData } from "../../../types/project.ts";

const musicPhotographyBase = {
  status: "completed",
  collectionIds: ["music-photography"],
  primaryRoleId: "photographer",
  industryIds: ["music"],
  workAreaIds: ["photography"],
} as const;

const berryPhotographyBase = {
  status: "completed",
  date: "2020",
  clientIds: ["berry-agency"],
  engagementIds: ["berry-agency-2020"],
  primaryRoleId: "photographer",
  roleIds: ["photographer"],
  workAreaIds: ["photography"],
} as const;

const behancePhotographyBase = {
  status: "completed",
  primaryRoleId: "photographer",
  roleIds: ["photographer"],
  workAreaIds: ["photography"],
} as const;

export const shootingsProjects = [
  {
    ...musicPhotographyBase,
    id: "shootings-obladaet",
    name: "Obladaet",
    date: "2020–2022",
    clientIds: ["obladaet"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-evasha",
    name: "Evasha",
    date: "2025",
    clientIds: ["evasha", "vk-music"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-igguana",
    name: "Igguana",
    date: "2023",
    clientIds: ["igguana"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-esmi",
    name: "ESMI",
    date: "2025",
    clientIds: ["esmi", "vk-music"],
    roleIds: ["photographer"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-hypression",
    name: "HYPRESSION",
    date: "2023",
    clientIds: ["hypression"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-ofelia",
    name: "Ofelia",
    date: "2023",
    clientIds: ["ofelia"],
    roleIds: ["photographer"],
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-model-tests",
    name: "Berry Agency — модельные тесты",
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-editorial",
    name: "Berry Agency — эдиториал с моделью агентства",
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-lookbook",
    name: "Berry Agency — лукбук",
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-product",
    name: "Berry Agency — предметная съёмка для бренда подарков",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-ecobasik",
    name: "Lookbook for Ecobasik",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-offmi",
    name: "Offmi",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-cinema-stills-2",
    name: "CINEMA STILLS 2",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-anka-model-tests",
    name: "Anka model tests",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-choose-your-character",
    name: "Choose your character",
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-editorial-photography",
    name: "Editorial photography",
  },
] as const satisfies readonly ProjectData[];

export type ShootingsProject = (typeof shootingsProjects)[number];
export type ShootingsProjectId = ShootingsProject["id"];
