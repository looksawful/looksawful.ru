import navigationJson from "../content/navigation.json" with { type: "json" };
import {
  PRIMARY_NAVIGATION_PAGE_IDS,
  type PrimaryNavigationPageId,
} from "../site/navigation/primary.ts";
import {
  expectRecord,
  expectStructuralString,
} from "./content/editorial-validation.ts";

export type NavigationLabelId = PrimaryNavigationPageId;

export interface NavigationLabelData {
  id: NavigationLabelId;
  label: string;
}

const navigationLabelIds = new Set<string>(PRIMARY_NAVIGATION_PAGE_IDS);

function parseNavigationLabel(value: unknown, index: number): NavigationLabelData {
  const itemLabel = `navigationLabels[${index}]`;
  const record = expectRecord(value, itemLabel);

  const idValue = expectStructuralString(record.id, `${itemLabel}.id`);
  if (!navigationLabelIds.has(idValue)) {
    throw new Error(`unexpected navigation label id: ${idValue}`);
  }

  const id = PRIMARY_NAVIGATION_PAGE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected navigation label id: ${idValue}`);

  return {
    id,
    label: expectStructuralString(record.label, `${itemLabel}.label`),
  };
}

export function parseNavigationLabels(value: unknown): readonly NavigationLabelData[] {
  if (!Array.isArray(value)) throw new Error("navigation labels content must be an array");

  const parsed = value.map(parseNavigationLabel);
  const byId = new Map<NavigationLabelId, NavigationLabelData>();

  for (const item of parsed) {
    if (byId.has(item.id)) throw new Error(`duplicate navigation label id: ${item.id}`);
    byId.set(item.id, item);
  }

  for (const expectedId of PRIMARY_NAVIGATION_PAGE_IDS) {
    if (!byId.has(expectedId)) {
      throw new Error(`missing required navigation label id: ${expectedId}`);
    }
  }

  if (parsed.length !== PRIMARY_NAVIGATION_PAGE_IDS.length) {
    throw new Error(
      `navigation label count must remain ${PRIMARY_NAVIGATION_PAGE_IDS.length}; got ${parsed.length}`,
    );
  }

  return Object.freeze(PRIMARY_NAVIGATION_PAGE_IDS.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`missing required navigation label id: ${id}`);
    return Object.freeze({ ...item });
  }));
}

const rawNavigationLabels: unknown = navigationJson;
export const navigationLabels = parseNavigationLabels(rawNavigationLabels);

export function getNavigationLabel(
  id: NavigationLabelId,
  source: readonly NavigationLabelData[] = navigationLabels,
): string {
  const item = source.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Navigation label is unavailable: ${id}`);
  return item.label;
}
