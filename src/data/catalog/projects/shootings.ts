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
  projectTypeIds: ["shooting", "music-shooting"],
  primaryRoleId: "photographer",
  industryIds: ["music"],
  workAreaIds: ["photography"],
} as const;

const berryPhotographyBase = {
  status: "completed",
  clientIds: ["berry-agency"],
  engagementIds: ["berry-agency-2020"],
  projectTypeIds: ["shooting"],
  primaryRoleId: "photographer",
  roleIds: ["photographer"],
  workAreaIds: ["photography"],
} as const;

const behancePhotographyBase = {
  status: "completed",
  projectTypeIds: ["shooting"],
  primaryRoleId: "photographer",
  roleIds: ["photographer"],
  workAreaIds: ["photography"],
} as const;

const optionalDate = (date: string) => (date ? { date } : {});

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
    projectTypeIds: ["shooting", "portrait-shooting", "fashion-shooting"],
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-editorial",
    name: berryEditorialEditorial.title,
    date: berryEditorialEditorial.date,
    projectTypeIds: ["shooting", "editorial"],
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-lookbook",
    name: berryLookbookEditorial.title,
    date: berryLookbookEditorial.date,
    projectTypeIds: ["shooting", "lookbook"],
  },
  {
    ...berryPhotographyBase,
    id: "shootings-berry-product",
    name: berryProductEditorial.title,
    date: berryProductEditorial.date,
    projectTypeIds: ["shooting", "catalog", "product-shooting"],
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-ecobasik",
    name: ecobasikEditorial.title,
    ...optionalDate(ecobasikEditorial.date),
    projectTypeIds: ["shooting", "lookbook", "fashion-shooting"],
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-offmi",
    name: offmiEditorial.title,
    ...optionalDate(offmiEditorial.date),
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-cinema-stills-2",
    name: cinemaStillsEditorial.title,
    ...optionalDate(cinemaStillsEditorial.date),
    projectTypeIds: ["shooting", "editorial"],
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-anka-model-tests",
    name: ankaModelTestsEditorial.title,
    ...optionalDate(ankaModelTestsEditorial.date),
    projectTypeIds: ["shooting", "portrait-shooting", "fashion-shooting"],
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-choose-your-character",
    name: chooseYourCharacterEditorial.title,
    ...optionalDate(chooseYourCharacterEditorial.date),
    projectTypeIds: ["shooting", "editorial", "fashion-shooting"],
  },
  {
    ...behancePhotographyBase,
    id: "shootings-behance-editorial-photography",
    name: editorialPhotographyEditorial.title,
    ...optionalDate(editorialPhotographyEditorial.date),
    projectTypeIds: ["shooting", "editorial"],
  },
] as const satisfies readonly ProjectData[];

export type ShootingsProject = (typeof shootingsProjects)[number];
export type ShootingsProjectId = ShootingsProject["id"];
