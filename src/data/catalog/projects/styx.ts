import type { ProjectData } from "../../../types/project.ts";

const styxBase = {
  status: "completed",
  caseIds: ["styx"],
  clientIds: ["styx-jewel"],
  engagementIds: ["styx-jewel-2021-2025"],
  industryIds: ["jewelry", "fashion"],
} as const;

export const styxProjects = [
  {
    ...styxBase,
    id: "styx-brand-system",
    name: "Айдентика Styx Jewel",
    projectTypeIds: ["brand-project", "identity-project"],
    primaryRoleId: "designer",
    roleIds: ["designer", "graphic-designer", "digital-artist"],
  },
  {
    ...styxBase,
    id: "styx-ecommerce-site",
    name: "Сайт Styx Jewel",
    projectTypeIds: ["website", "ecommerce"],
    primaryRoleId: "designer",
    roleIds: ["designer"],
  },
  {
    ...styxBase,
    id: "styx-evident-things-collaboration-2022",
    name: "Styx Jewel × Evident Things",
    date: "2022",
    clientIds: ["styx-jewel", "evident-things"],
    projectTypeIds: ["shooting"],
    primaryRoleId: "photographer",
    roleIds: ["photographer", "producer"],
  },
  {
    ...styxBase,
    id: "styx-lookbook-2024",
    name: "Лукбук Styx Jewel",
    date: "2024",
    projectTypeIds: ["lookbook"],
  },
  {
    ...styxBase,
    id: "styx-founder-portraits-2022",
    name: "Портреты основателя Styx Jewel",
    date: "2022",
    projectTypeIds: ["portrait-shooting"],
    primaryRoleId: "photographer",
    roleIds: ["photographer", "producer"],
  },
  {
    ...styxBase,
    id: "styx-jacket-lookbook",
    name: "Лукбук куртки Styx Jewel",
    projectTypeIds: ["lookbook"],
    primaryRoleId: "digital-artist",
    roleIds: ["digital-artist"],
  },
  {
    ...styxBase,
    id: "styx-mystery-chest-animation-2024",
    name: "Mystery Chest",
    date: "2024",
    projectTypeIds: ["scanography-project", "animation"],
    primaryRoleId: "digital-artist",
    roleIds: ["digital-artist"],
  },
  {
    ...styxBase,
    id: "styx-gift-sculpture-animation-2025",
    name: "Подарочная скульптура Styx Jewel",
    date: "2025",
    projectTypeIds: ["scanography-project", "animation"],
    primaryRoleId: "digital-artist",
    roleIds: ["digital-artist"],
  },
  {
    ...styxBase,
    id: "styx-apocriphon-scanography-2022",
    name: "Apocriphon",
    date: "2022",
    projectTypeIds: ["scanography-project"],
    primaryRoleId: "digital-artist",
    roleIds: ["digital-artist"],
  },
] as const satisfies readonly ProjectData[];

export type StyxProject = (typeof styxProjects)[number];
export type StyxProjectId = StyxProject["id"];
