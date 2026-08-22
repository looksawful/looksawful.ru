import type { ProjectData } from "../../../types/project.ts";

const musicPhotographyBase = {
  status: "completed",
  collectionIds: ["music-photography"],
  primaryRoleId: "photographer",
  industryIds: ["music"],
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
] as const satisfies readonly ProjectData[];

export type ShootingsProject = (typeof shootingsProjects)[number];
export type ShootingsProjectId = ShootingsProject["id"];
