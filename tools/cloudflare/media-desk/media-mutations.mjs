const MEBIBYTE = 1024 * 1024;

const MEDIA_LIMITS = Object.freeze({
  image: Object.freeze({ maxBytes: 50 * MEBIBYTE }),
  video: Object.freeze({ maxBytes: 95 * MEBIBYTE }),
});

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".m4v", ".mov", ".mp4", ".webm"]);
const UPLOAD_ROOTS = ["public/media/", "public/pets/"];

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

function assertSafeRepositoryPath(path) {
  if (
    typeof path !== "string"
    || path.length === 0
    || path.startsWith("/")
    || path.includes("\\")
    || path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
    || !UPLOAD_ROOTS.some((root) => path.startsWith(root))
  ) {
    throw new Error(`Unsafe upload path: ${String(path)}`);
  }
  return path;
}

function assertKnownMediaType(mediaType) {
  if (mediaType !== "image" && mediaType !== "video") {
    throw new TypeError(`Unsupported media type: ${String(mediaType)}`);
  }
  return mediaType;
}

export function validateUploadTarget({ path, mediaType, byteLength }) {
  const safePath = assertSafeRepositoryPath(path);
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
