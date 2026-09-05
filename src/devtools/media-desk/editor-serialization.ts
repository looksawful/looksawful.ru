import type { MediaCatalogItem } from "../../data/media/catalog.ts";
import type {
  MediaEditorialPatch,
  MediaEditorialWritePatch,
  RegisteredMediaEditorialPatch,
} from "./editor-model.ts";

export interface MediaEditorValues {
  title: string;
  alt: string;
  description: string;
  date: string;
  projectIds: readonly string[];
  workAreaIds: readonly string[];
  projectTypeIds: readonly string[];
  deliverableIds: readonly string[];
  tags: readonly string[];
  credits: readonly string[];
  showInCatalog: boolean;
  reusable: boolean;
  archived: boolean;
}

function cleanStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function fullMediaEditorialPatch(values: MediaEditorValues): MediaEditorialPatch {
  return {
    title: values.title.trim(),
    alt: values.alt.trim(),
    description: values.description.trim(),
    date: values.date.trim(),
    projectIds: cleanStrings(values.projectIds) as MediaEditorialPatch["projectIds"],
    workAreaIds: cleanStrings(values.workAreaIds) as MediaEditorialPatch["workAreaIds"],
    projectTypeIds: cleanStrings(values.projectTypeIds) as MediaEditorialPatch["projectTypeIds"],
    deliverableIds: cleanStrings(values.deliverableIds) as MediaEditorialPatch["deliverableIds"],
    tags: cleanStrings(values.tags),
    credits: cleanStrings(values.credits),
    showInCatalog: values.showInCatalog,
    reusable: values.reusable,
    archived: values.archived,
  };
}

export function mediaEditorialWritePatchForOrigin(
  patch: MediaEditorialPatch,
  origin: MediaCatalogItem["origin"],
): MediaEditorialWritePatch {
  if (origin !== "registered") return patch;
  const { projectIds: _projectIds, ...registered } = patch;
  return registered as RegisteredMediaEditorialPatch;
}

export function buildMediaEditorialPatch(
  values: MediaEditorValues,
): MediaEditorialPatch;
export function buildMediaEditorialPatch(
  values: MediaEditorValues,
  origin: "registered",
): RegisteredMediaEditorialPatch;
export function buildMediaEditorialPatch(
  values: MediaEditorValues,
  origin: "cms",
): MediaEditorialPatch;
export function buildMediaEditorialPatch(
  values: MediaEditorValues,
  origin?: MediaCatalogItem["origin"],
): MediaEditorialWritePatch {
  const patch = fullMediaEditorialPatch(values);
  return origin ? mediaEditorialWritePatchForOrigin(patch, origin) : patch;
}

export function applyMediaEditorialPatchToItem(
  item: MediaCatalogItem,
  patch: Partial<MediaEditorialPatch>,
): MediaCatalogItem {
  return { ...item, ...patch };
}
