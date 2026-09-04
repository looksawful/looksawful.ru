import type { MediaCatalogItem } from "../../data/media/catalog.ts";

export const MEDIA_EDITORIAL_FIELDS = [
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "reusable",
  "archived",
] as const;

export const REGISTERED_MEDIA_EDITORIAL_FIELDS = [
  "title",
  "alt",
  "description",
  "date",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "reusable",
  "archived",
] as const;

export type MediaEditorialField = (typeof MEDIA_EDITORIAL_FIELDS)[number];
export type MediaEditorialPatch = Pick<MediaCatalogItem, MediaEditorialField>;

const editorialFieldSet = new Set<string>(MEDIA_EDITORIAL_FIELDS);
const registeredEditorialFieldSet = new Set<string>(REGISTERED_MEDIA_EDITORIAL_FIELDS);

export function pickMediaEditorialMetadata(item: MediaCatalogItem): MediaEditorialPatch {
  return Object.fromEntries(
    MEDIA_EDITORIAL_FIELDS.map((field) => [field, item[field]]),
  ) as MediaEditorialPatch;
}

function applyAllowedMediaEditorialPatch(
  record: Record<string, unknown>,
  patch: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  errorPrefix: string,
): Record<string, unknown> {
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) {
      throw new Error(`${errorPrefix} cannot edit protected field "${key}"`);
    }
  }

  const next = { ...record };
  for (const [field, value] of Object.entries(patch)) {
    next[field] = value;
  }
  return next;
}

export function applyMediaEditorialPatch(
  record: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return applyAllowedMediaEditorialPatch(
    record,
    patch,
    editorialFieldSet,
    "Media Desk",
  );
}

/**
 * Registered catalog rows are library defaults. Project membership belongs to
 * MediaEntry usages, so an asset-level Media Desk save must never create or
 * overwrite `projectIds` in the registered catalog source.
 */
export function applyRegisteredMediaEditorialPatch(
  record: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return applyAllowedMediaEditorialPatch(
    record,
    patch,
    registeredEditorialFieldSet,
    "Registered Media Desk metadata",
  );
}

export interface ContentDeskTextEntry {
  sourcePath: string;
  fieldPath: string;
  value: string;
}

const STRUCTURAL_TEXT_KEYS = new Set([
  "id",
  "ids",
  "href",
  "url",
  "src",
  "sourcesrc",
  "deliverysrc",
  "postersrc",
  "path",
  "route",
  "slug",
  "type",
  "kind",
  "layout",
  "device",
  "theme",
  "variant",
  "captionview",
  "mediatype",
  "entryid",
  "assetid",
  "projectid",
  "projectids",
  "clientid",
  "clientids",
  "engagementid",
  "engagementids",
  "roleid",
  "roleids",
  "workareaids",
  "projecttypeids",
  "deliverableids",
  "tags",
]);

function sourcePathFromModulePath(modulePath: string): string {
  const normalized = modulePath.replaceAll("\\", "/");
  const marker = "/content/";
  const index = normalized.lastIndexOf(marker);
  if (index >= 0) return `src${normalized.slice(index)}`;
  return normalized.replace(/^\.\.\/\.\.\//, "src/");
}

function isStructuralTextKey(key: string): boolean {
  const normalized = key.toLocaleLowerCase();
  return STRUCTURAL_TEXT_KEYS.has(normalized)
    || normalized.endsWith("id")
    || normalized.endsWith("ids");
}

function walkTextEntries(
  value: unknown,
  sourcePath: string,
  path: readonly string[],
  parentKey: string,
  result: ContentDeskTextEntry[],
): void {
  if (typeof value === "string") {
    if (!isStructuralTextKey(parentKey)) {
      result.push({ sourcePath, fieldPath: path.join("."), value });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkTextEntries(item, sourcePath, [...path, String(index)], parentKey, result);
    });
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    walkTextEntries(child, sourcePath, [...path, key], key, result);
  }
}

export function collectContentDeskTextEntries(
  sources: Readonly<Record<string, unknown>>,
): readonly ContentDeskTextEntry[] {
  const result: ContentDeskTextEntry[] = [];
  for (const [modulePath, source] of Object.entries(sources)) {
    walkTextEntries(source, sourcePathFromModulePath(modulePath), [], "", result);
  }
  return result.sort((left, right) =>
    left.sourcePath.localeCompare(right.sourcePath)
      || left.fieldPath.localeCompare(right.fieldPath)
  );
}
