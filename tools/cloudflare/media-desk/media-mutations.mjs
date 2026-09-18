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
  expectedHead,
}) {
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
    expectedHead: head,
    writes: [
      { path: filePath, content: uploadBytes },
      { path: catalogPath, content: catalogSource },
    ],
  };
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function extensionOfFilename(name) {
  const dot = String(name ?? "").lastIndexOf(".");
  return dot >= 0 ? String(name).slice(dot + 1).toLowerCase() : "";
}

function pngDimensions(bytes) {
  const signature = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value) || ascii(bytes, 12, 4) !== "IHDR") {
    throw new Error("Invalid PNG signature or IHDR metadata");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
function gifDimensions(bytes) {
  if (bytes.length < 10 || !["GIF87a", "GIF89a"].includes(ascii(bytes, 0, 6))) {
    throw new Error("Invalid GIF signature");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
}

function jpegDimensions(bytes) {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Invalid JPEG signature");
  const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  for (let offset = 2; offset + 8 < bytes.length;) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (sof.has(marker)) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
    }
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    if (offset + 3 >= bytes.length) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2) break;
    offset += 2 + length;
  }
  throw new Error("Invalid JPEG dimensions");
}
function webpDimensions(bytes) {
  if (bytes.length < 25 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    throw new Error("Invalid WebP signature");
  }
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return { width, height };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10));
    return { width, height };
  }
  throw new Error("Invalid WebP dimensions");
}

function replacementDimensions(extension, bytes) {
  if (extension === "png") return pngDimensions(bytes);
  if (extension === "gif") return gifDimensions(bytes);
  if (extension === "jpg" || extension === "jpeg") return jpegDimensions(bytes);
  if (extension === "webp") return webpDimensions(bytes);
  throw new Error(`Remote replace does not support ${extension || "unknown"} images`);
}
export function planReplace({ resolved, file, expectedRevision, expectedHead }) {
  const revision = requiredGuard(expectedRevision, "expected revision");
  const head = requiredGuard(expectedHead, "expected branch head");
  if (!resolved || typeof resolved !== "object" || !resolved.record) {
    throw new TypeError("Media Desk resolved CMS asset is required");
  }
  if (resolved.record.mediaType !== "image") {
    throw new Error("Remote replace currently supports CMS images only");
  }
  if (!file || typeof file !== "object") throw new TypeError("Replacement file is required");
  const bytes = file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes ?? []);
  if (bytes.byteLength === 0) throw new TypeError("Replacement media cannot be empty");
  const extension = extensionOfFilename(file.name);
  if (extension !== resolved.extension) throw new Error("Replacement must keep the same file extension");
  if (file.type !== resolved.expectedMime) throw new Error("Replacement MIME must match canonical media MIME");
  validateUploadTarget({ path: resolved.filePath, mediaType: "image", byteLength: bytes.byteLength });
  const { width, height } = replacementDimensions(extension, bytes);
  if (!(width > 0 && height > 0)) throw new Error("Replacement image dimensions are invalid");

  const catalogRecord = {
    ...resolved.record,
    width,
    height,
    durationSeconds: 0,
    mimeType: resolved.expectedMime,
    byteLength: bytes.byteLength,
  };
  const catalogSource = `${JSON.stringify(catalogRecord, null, 2)}\n`;
  return {
    kind: "replace",
    assetId: resolved.assetId,
    filePath: resolved.filePath,
    catalogPath: resolved.catalogPath,
    bytes,
    catalogRecord,
    expectedRevision: revision,
    expectedHead: head,
    writes: [
      { path: resolved.filePath, content: bytes },
      { path: resolved.catalogPath, content: catalogSource },
    ],
  };
}
