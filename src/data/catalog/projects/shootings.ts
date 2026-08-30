import type { ProjectData } from "../../../types/project.ts";
import { getShootingEditorialRecord } from "../../content/shootings-editorial.ts";

const obladaetEditorial = getShootingEditorialRecord("shootings-obladaet");
const evashaEditorial = getShootingEditorialRecord("shootings-evasha");
const igguanaEditorial = getShootingEditorialRecord("shootings-igguana");
const esmiEditorial = getShootingEditorialRecord("shootings-esmi");
const hypressionEditorial = getShootingEditorialRecord("shootings-hypression");
const ofeliaEditorial = getShootingEditorialRecord("shootings-ofelia");
const berryModelTestsEditorial = getShootingEditorialRecord("shootings-berry-model-tests");
const berryEditorialEditorial = getShootingEditorialRecord("shootings-berry-editorial");
const berryLookbookEditorial = getShootingEditorialRecord("shootings-berry-lookbook");
const berryProductEditorial = getShootingEditorialRecord("shootings-berry-product");
const ecobasikEditorial = getShootingEditorialRecord("shootings-behance-ecobasik");
const offmiEditorial = getShootingEditorialRecord("shootings-behance-offmi");
const cinemaStillsEditorial = getShootingEditorialRecord("shootings-behance-cinema-stills-2");
const ankaModelTestsEditorial = getShootingEditorialRecord("shootings-behance-anka-model-tests");
const chooseYourCharacterEditorial = getShootingEditorialRecord("shootings-behance-choose-your-character");
const editorialPhotographyEditorial = getShootingEditorialRecord("shootings-behance-editorial-photography");

const musicPhotographyBase = {
  status: "completed",
  collectionIds: ["music-photography"],
  primaryRoleId: "photographer",
  industryIds: ["music"],
  workAreaIds: ["photography"],
} as const;

const berryPhotographyBase = {
  status: "completed",
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
    name: obladaetEditorial.title,
    date: obladaetEditorial.date,
    clientIds: ["obladaet"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-evasha",
    name: evashaEditorial.title,
    date: evashaEditorial.date,
    clientIds: ["evasha", "vk-music"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-igguana",
    name: igguanaEditorial.title,
    date: igguanaEditorial.date,
    clientIds: ["igguana"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-esmi",
    name: esmiEditorial.title,
    date: esmiEditorial.date,
    clientIds: ["esmi", "vk-music"],
    roleIds: ["photographer"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-hypression",
    name: hypressionEditorial.title,
    date: hypressionEditorial.date,
    clientIds: ["hypression"],
    roleIds: ["photographer", "digital-artist"],
  },
  {
    ...musicPhotographyBase,
    id: "shootings-ofelia",
    name: ofeliaEditorial.title,
    date: ofeliaEditorial.date,
    clientIds: ["ofelia"],
    roleIds: ["photographer"],
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-model-tests",
    name: berryModelTestsEditorial.title,
    date: berryModelTestsEditorial.date,
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-editorial",
    name: berryEditorialEditorial.title,
    date: berryEditorialEditorial.date,
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-lookbook",
    name: berryLookbookEditorial.title,
    date: berryLookbookEditorial.date,
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-product",
    name: berryProductEditorial.title,
    date: berryProductEditorial.date,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-ecobasik",
    name: ecobasikEditorial.title,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-offmi",
    name: offmiEditorial.title,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-cinema-stills-2",
    name: cinemaStillsEditorial.title,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-anka-model-tests",
    name: ankaModelTestsEditorial.title,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-choose-your-character",
    name: chooseYourCharacterEditorial.title,
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-editorial-photography",
    name: editorialPhotographyEditorial.title,
  },
] as const satisfies readonly ProjectData[];

export type ShootingsProject = (typeof shootingsProjects)[number];
export type ShootingsProjectId = ShootingsProject["id"];
