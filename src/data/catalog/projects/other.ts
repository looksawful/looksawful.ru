import type { ProjectData } from "../../../types/project.ts";
import { awfulCasesEditorialContent } from "../../content/awful-cases-editorial.ts";

export const otherProjects = [
  {
    id: "berry-social-content-2020",
    name: "Berry Agency — контент для соцсетей",
    date: "2020",
    status: "completed",
    clientIds: ["berry-agency"],
    engagementIds: ["berry-agency-2020"],
    projectTypeIds: ["social-content"],
    primaryRoleId: "smm-manager",
    primaryRoleLabel: "СММ",
    roleIds: ["smm-manager", "graphic-designer"],
  },
  {
    id: "s-and-s-first-lookbook",
    name: "S&S — первый лукбук",
    status: "completed",
    clientIds: ["s-and-s"],
    engagementIds: ["s-and-s-2018-2019"],
    projectTypeIds: ["lookbook"],
    primaryRoleId: "smm-manager",
    primaryRoleLabel: "СММ",
    roleIds: ["smm-manager"],
  },
  {
    id: "s-and-s-catalog-content",
    name: "S&S — каталожный контент",
    status: "completed",
    clientIds: ["s-and-s"],
    engagementIds: ["s-and-s-2018-2019"],
    projectTypeIds: ["catalog"],
    primaryRoleId: "smm-manager",
    primaryRoleLabel: "СММ",
    roleIds: ["smm-manager"],
  },
  {
    id: "awful-cases",
    name: awfulCasesEditorialContent.title,
    date: awfulCasesEditorialContent.period,
    status: "active",
    collectionIds: ["pet-projects"],
    summary: awfulCasesEditorialContent.summary,
    description: awfulCasesEditorialContent.lead,
    engagementTypeIds: ["self-initiated", "open-source"],
    primaryRoleId: "developer",
    roleIds: ["developer"],
  },
  {
    id: "moves-awful",
    name: "Moves Awful",
    date: "2025",
    status: "active",
    collectionIds: ["pet-projects"],
    summary: "Библиотека анимированных галерей для лендингов.",
    engagementTypeIds: ["self-initiated"],
    primaryRoleId: "developer",
    roleIds: ["developer"],
  },
  {
    id: "berserk-timer",
    name: "Berserk Timer",
    status: "active",
    collectionIds: ["pet-projects"],
    summary: "CLI-таймер с режимом свидетеля и гибкой настройкой длительности.",
    description:
      "Целью было сделать простой CLI-таймер для Windows, который после каждой сессии спрашивает: «Чем вы занимались?». Он сочетает гибкость, простоту и отсутствие рекламы.",
    engagementTypeIds: ["self-initiated", "open-source"],
    primaryRoleId: "developer",
    roleIds: ["developer"],
  },
] as const satisfies readonly ProjectData[];

export type OtherProject = (typeof otherProjects)[number];
export type OtherProjectId = OtherProject["id"];
