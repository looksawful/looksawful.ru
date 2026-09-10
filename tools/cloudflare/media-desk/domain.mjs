const MEDIA_EDITORIAL_FIELDS = new Set([
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
  "showInCatalog",
  "reusable",
  "archived",
]);

const REGISTERED_MEDIA_EDITORIAL_FIELDS = new Set([
  "title",
  "alt",
  "description",
  "date",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
  "showInCatalog",
  "reusable",
  "archived",
]);

const TEXT_SOURCE_FILES = new Set([
  "src/content/navigation.json",
  "src/content/projects.json",
]);

const TEXT_SOURCE_DIRECTORIES = [
  "src/content/editorial/",
  "src/content/cases/",
  "src/content/collections/",
  "src/content/shootings/",
  "src/content/standalone-projects/",
];

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

const ARRAY_INDEX = /^(0|[1-9]\d*)$/;

function expectPatchShape(current, key, value) {
  const previous = current[key];

  if (Array.isArray(previous)) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      throw new TypeError(`Media Desk field "${key}" must remain a string array`);
    }
    if (new Set(value).size !== value.length) {
      throw new TypeError(`Media Desk field "${key}" must not contain duplicates`);
    }
    return;
  }

  if (typeof previous === "boolean") {
    if (typeof value !== "boolean") {
      throw new TypeError(`Media Desk field "${key}" must remain a boolean`);
    }
    return;
  }

  if (typeof previous === "string") {
    if (typeof value !== "string") {
      throw new TypeError(`Media Desk field "${key}" must remain a string`);
    }
    return;
  }

  if (previous === undefined && key === "showInCatalog") {
    if (typeof value !== "boolean") {
      throw new TypeError('Media Desk field "showInCatalog" must be a boolean');
    }
    return;
  }

  throw new TypeError(`Media Desk field "${key}" is not editable in its current shape`);
}

export function applyCloudflareMediaPatch(record, patch, origin) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new TypeError("Media catalog record must be an object");
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new TypeError("Media Desk patch must be an object");
  }
  if (origin !== "registered" && origin !== "upload") {
    throw new TypeError("Media Desk origin is invalid");
  }

  const allowed = origin === "registered"
    ? REGISTERED_MEDIA_EDITORIAL_FIELDS
    : MEDIA_EDITORIAL_FIELDS;

  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key)) {
      throw new Error(`Media Desk cannot edit protected field "${key}"`);
    }
    expectPatchShape(record, key, value);
  }

  return { ...record, ...patch };
}

export function isAllowedTextSource(sourcePath) {
  if (typeof sourcePath !== "string" || sourcePath.length === 0) return false;
  if (sourcePath.includes("\\") || sourcePath.includes("..") || sourcePath.startsWith("/")) return false;
  if (!sourcePath.endsWith(".json")) return false;
  if (TEXT_SOURCE_FILES.has(sourcePath)) return true;
  return TEXT_SOURCE_DIRECTORIES.some((directory) => sourcePath.startsWith(directory));
}

function isStructuralTextKey(key) {
  const normalized = key.toLocaleLowerCase();
  return STRUCTURAL_TEXT_KEYS.has(normalized)
    || normalized.endsWith("id")
    || normalized.endsWith("ids");
}

function walkTextEntries(value, sourcePath, path, parentKey, result) {
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

  for (const [key, child] of Object.entries(value)) {
    walkTextEntries(child, sourcePath, [...path, key], key, result);
  }
}

export function collectTextEntries(sources) {
  const result = [];
  for (const [sourcePath, source] of Object.entries(sources)) {
    if (!isAllowedTextSource(sourcePath)) continue;
    walkTextEntries(source, sourcePath, [], "", result);
  }
  return result.sort((left, right) =>
    left.sourcePath.localeCompare(right.sourcePath)
      || left.fieldPath.localeCompare(right.fieldPath)
  );
}

function parseArrayIndex(segment) {
  if (!ARRAY_INDEX.test(segment)) return null;
  const value = Number(segment);
  return Number.isSafeInteger(value) ? value : null;
}

function existingPathValue(container, segment, fieldPath) {
  if (Array.isArray(container)) {
    const index = parseArrayIndex(segment);
    if (index === null || index >= container.length) {
      throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
    }
    return container[index];
  }

  if (
    !container
    || typeof container !== "object"
    || !Object.prototype.hasOwnProperty.call(container, segment)
  ) {
    throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
  }

  return container[segment];
}

export function replaceTextLeaf(source, fieldPath, value) {
  if (typeof fieldPath !== "string") {
    throw new TypeError("Content Desk fieldPath must be a string");
  }
  if (typeof value !== "string") {
    throw new TypeError("Content Desk value must be a string");
  }

  if (fieldPath === "") {
    if (typeof source !== "string") {
      throw new TypeError("Content Desk root text field must still be a string");
    }
    return value;
  }

  const segments = fieldPath.split(".");
  let parent = source;
  for (const segment of segments.slice(0, -1)) {
    parent = existingPathValue(parent, segment, fieldPath);
  }

  const leafSegment = segments.at(-1) ?? "";
  const current = existingPathValue(parent, leafSegment, fieldPath);
  if (typeof current !== "string") {
    throw new TypeError(`Content Desk text field "${fieldPath}" must still be a string`);
  }

  if (Array.isArray(parent)) {
    const index = parseArrayIndex(leafSegment);
    if (index === null || index >= parent.length) {
      throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
    }
    parent[index] = value;
  } else if (parent && typeof parent === "object") {
    parent[leafSegment] = value;
  } else {
    throw new Error(`Content Desk text field "${fieldPath}" no longer exists`);
  }

  return source;
}
