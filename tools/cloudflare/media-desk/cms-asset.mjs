const CMS_ASSET_ID = /^cms-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/iu;
const IMAGE_EXTENSIONS = new Set(["avif", "gif", "jpeg", "jpg", "png", "svg", "webp"]);
const VIDEO_EXTENSIONS = new Set(["m4v", "mov", "mp4", "webm"]);
const MIME_BY_EXTENSION = new Map([
  ["avif", "image/avif"],
  ["gif", "image/gif"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["svg", "image/svg+xml"],
  ["webp", "image/webp"],
  ["m4v", "video/x-m4v"],
  ["mov", "video/quicktime"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"],
]);

export function persistedCmsAssetId(assetId) {
  const match = CMS_ASSET_ID.exec(String(assetId));
  if (!match) throw new Error("Remote destructive media operations require a cms-UUID asset identity");
  return match[1].toLowerCase();
}

export function cmsCatalogPath(assetId) {
  return `src/content/media-catalog/uploads/${persistedCmsAssetId(assetId)}.json`;
}
function canonicalRecord(assetId, source) {
  const persistedId = persistedCmsAssetId(assetId);
  let record;
  try {
    record = JSON.parse(source);
  } catch {
    throw new Error(`CMS media catalog record is invalid JSON: ${persistedId}`);
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`CMS media catalog record is invalid: ${persistedId}`);
  }
  if (record.id !== persistedId) {
    throw new Error(`CMS media catalog identity does not match asset: ${assetId}`);
  }
  if (record.mediaType !== "image" && record.mediaType !== "video") {
    throw new Error(`CMS media catalog type is not destructive-authorable: ${String(record.mediaType)}`);
  }
  const prefix = `/media/catalog/${persistedId}.`;
  if (typeof record.src !== "string" || !record.src.startsWith(prefix)) {
    throw new Error(`CMS media canonical source path does not match asset: ${assetId}`);
  }
  const extension = record.src.slice(prefix.length).toLowerCase();
  if (!extension || extension.includes("/") || extension.includes("?") || extension.includes("#")) {
    throw new Error(`CMS media canonical source extension is invalid: ${record.src}`);
  }
  const allowed = record.mediaType === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  if (!allowed.has(extension)) {
    throw new Error(`CMS media source extension does not match media type: ${record.src}`);
  }
  const expectedMime = MIME_BY_EXTENSION.get(extension);
  if (record.mimeType && record.mimeType !== expectedMime) {
    throw new Error(`CMS media MIME does not match canonical source: ${record.src}`);
  }
  if (!(Number(record.width) > 0) || !(Number(record.height) > 0)) {
    throw new Error(`CMS media dimensions are invalid: ${assetId}`);
  }
  if (!Number.isFinite(Number(record.byteLength)) || Number(record.byteLength) <= 0) {
    throw new Error(`CMS media byte length is invalid: ${assetId}`);
  }
  return {
    record,
    persistedId,
    extension,
    expectedMime,
    filePath: `public${record.src}`,
  };
}

export async function resolveCmsAssetRecord({ assetId, readSource }) {
  if (typeof readSource !== "function") throw new TypeError("CMS asset resolver requires readSource");
  const catalogPath = cmsCatalogPath(assetId);
  const current = await readSource(catalogPath);
  const resolved = canonicalRecord(assetId, current?.text);
  return {
    assetId,
    catalogPath,
    filePath: resolved.filePath,
    extension: resolved.extension,
    expectedMime: resolved.expectedMime,
    record: resolved.record,
    revision: current?.revision,
    branchHead: current?.branchHead,
  };
}
