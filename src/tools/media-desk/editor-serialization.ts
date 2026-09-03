import type { MediaEditorialPatch } from "./editor-model.ts";

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
  reusable: boolean;
  archived: boolean;
}

function cleanStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function buildMediaEditorialPatch(values: MediaEditorValues): MediaEditorialPatch {
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
    reusable: values.reusable,
    archived: values.archived,
  };
}
