const MEBIBYTE = 1024 * 1024;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const MEDIA_LIMITS = Object.freeze({
  image: Object.freeze({ maxBytes: 50 * MEBIBYTE }),
  video: Object.freeze({ maxBytes: 95 * MEBIBYTE }),
});

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".m4v", ".mov", ".mp4", ".webm"]);
const UPLOAD_ROOT = "public/media/catalog/";

function requiredGuard(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Media Desk ${label} is required`);
  }
  return value;
}

function byteLengthOf(value) {
  if (value instanceof Uint8Array) return value.byteLength;
  if (value instanceof ArrayBuffer) return value.byteLength;
  throw new TypeError("Media Desk mutation bytes must be a Uint8Array or ArrayBuffer");
}

function extensionOf(path) {
  const file = path.split("/").at(-1) ?? "";
  const dot = file.lastIndexOf(".");
  return dot >= 0 ? file.slice(dot).toLowerCase() : "";
}

function assertSafeUploadPath(path) {
  if (
    typeof path !== "string"
    || path.length === 0
    || path.startsWith("/")
    || path.includes("\\")
    || path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
    || !path.startsWith(UPLOAD_ROOT)
  ) {
    throw new Error(`Unsafe upload path: ${String(path)}; uploads must use public/media/catalog/`);
  }
  return path;
}

function assertKnownMediaType(mediaType) {
  if (mediaType !== "image" && mediaType !== "video") {
    throw new TypeError(`Unsupported media type: ${String(mediaType)}`);
  }
  return mediaType;
}

function finiteNonNegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite non-negative number`);
  }
  return value;
}

function stringArray(value, fallback = []) {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError("Media catalog metadata arrays must contain strings");
  }
  return [...value];
}

export function validateUploadTarget({ path, mediaType, byteLength }) {
  const safePath = assertSafeUploadPath(path);
  const type = assertKnownMediaType(mediaType);
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) {
    throw new TypeError("Media upload byte length must be a positive integer");
  }

  const extension = extensionOf(safePath);
  const allowedExtensions = type === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  if (!allowedExtensions.has(extension)) {
    throw new Error(`Unsupported media extension for ${type}: ${extension || "(none)"}`);
  }

  const maxBytes = MEDIA_LIMITS[type].maxBytes;
  if (byteLength > maxBytes) {
    throw new Error(`${type} upload exceeds ${maxBytes / MEBIBYTE} MiB limit`);
  }

  return { path: safePath, mediaType: type, byteLength };
}

export function planUpload({
  id,
  filename,
  mediaType,
  bytes,
  width,
  height,
  durationSeconds = 0,
  mimeType,
  title,
  alt = "",
  description = "",
  date = "",
  projectIds,
  workAreaIds,
  projectTypeIds,
  deliverableIds,
  tags,
  credits,
  showInCatalog = false,
  reusable = false,
  archived = false,
  expectedRevision,
  expectedHead,
}) {
  const revision = requiredGuard(expectedRevision, "expected revision");
  const head = requiredGuard(expectedHead, "expected branch head");
  if (typeof id !== "string" || !UUID_V4.test(id)) throw new TypeError("Media Desk upload ID must be a UUID v4");
  if (typeof filename !== "string" || filename.length === 0 || filename.includes("/") || filename.includes("\\")) {
    throw new TypeError("Media Desk upload filename is invalid");
  }
  const uploadBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const extension = extensionOf(filename);
  const filePath = `${UPLOAD_ROOT}${id}${extension}`;
  const validated = validateUploadTarget({ path: filePath, mediaType, byteLength: byteLengthOf(uploadBytes) });
  if (typeof title !== "string" || title.trim().length === 0) throw new TypeError("Media Desk upload title is required");
  if (typeof mimeType !== "string" || mimeType.trim().length === 0) throw new TypeError("Media Desk upload MIME type is required");

  const catalogPath = `src/content/media-catalog/uploads/${id}.json`;
  const src = `/${validated.path.slice("public/".length)}`;
  const catalogRecord = {
    id,
    mediaType: validated.mediaType,
    src,
    deliverySrc: "",
    posterSrc: "",
    width: finiteNonNegative(width, "Media upload width"),
    height: finiteNonNegative(height, "Media upload height"),
    durationSeconds: finiteNonNegative(durationSeconds, "Media upload duration"),
    mimeType: mimeType.trim(),
    byteLength: validated.byteLength,
    title: title.trim(),
    alt: String(alt),
    description: String(description),
    date: String(date),
    projectIds: stringArray(projectIds),
    workAreaIds: stringArray(workAreaIds),
    projectTypeIds: stringArray(projectTypeIds),
    deliverableIds: stringArray(deliverableIds),
    tags: stringArray(tags),
    credits: stringArray(credits),
    showInCatalog: Boolean(showInCatalog),
    reusable: Boolean(reusable),
    archived: Boolean(archived),
  };
  const catalogSource = `${JSON.stringify(catalogRecord, null, 2)}\n`;

  return {
    kind: "upload",
    assetId: `cms-${id}`,
    filePath,
    catalogPath,
    catalogRecord,
    expectedRevision: revision,
    expectedHead: head,
    writes: [
      { path: filePath, content: uploadBytes },
      { path: catalogPath, content: catalogSource },
    ],
  };
}

export function planReplace({ asset, nextBytes, expectedRevision, expectedHead }) {
  const revision = requiredGuard(expectedRevision, "expected revision");
  const head = requiredGuard(expectedHead, "expected branch head");
  if (!asset || typeof asset !== "object") throw new TypeError("Media Desk asset is required");
  if (typeof asset.id !== "string" || asset.id.length === 0) throw new TypeError("Media Desk asset ID is required");
  if (typeof asset.filePath !== "string" || asset.filePath.length === 0) {
    throw new TypeError("Media Desk asset file path is required");
  }
  const bytes = nextBytes instanceof Uint8Array ? nextBytes : new Uint8Array(nextBytes);
  if (byteLengthOf(bytes) === 0) throw new TypeError("Replacement media cannot be empty");

  return {
    kind: "replace",
    assetId: asset.id,
    filePath: asset.filePath,
    bytes,
    expectedRevision: revision,
    expectedHead: head,
  };
}

export function planDelete({ record, expectedRevision, expectedHead }) {
  const revision = requiredGuard(expectedRevision, "expected revision");
  const head = requiredGuard(expectedHead, "expected branch head");
  if (!record || typeof record !== "object") throw new TypeError("Media Desk record is required");
  if (typeof record.id !== "string" || record.id.length === 0) throw new TypeError("Media Desk record ID is required");
  if (typeof record.filePath !== "string" || typeof record.catalogPath !== "string") {
    throw new TypeError("Media Desk delete requires file and catalog paths");
  }

  const usages = Array.isArray(record.usages) ? record.usages : [];
  const blockingUsages = usages.filter((usage) => usage?.blockingDelete === true);
  if (blockingUsages.length > 0) {
    const error = new Error("Referenced media cannot be deleted");
    error.name = "MediaDeskDependencyConflict";
    error.status = 409;
    error.blockingUsages = blockingUsages;
    throw error;
  }

  return {
    kind: "delete",
    assetId: record.id,
    removals: [record.filePath, record.catalogPath],
    expectedRevision: revision,
    expectedHead: head,
  };
}
