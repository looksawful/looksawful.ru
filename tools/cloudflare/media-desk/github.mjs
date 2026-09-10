const SAFE_ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const encoder = new TextEncoder();

export function parseRepositoryName(value) {
  const match = /^([^/]+)\/([^/]+)$/u.exec(value);
  if (!match) throw new Error("GitHub repository must use owner/name format");
  return { owner: match[1], name: match[2] };
}

export function mediaCandidatePaths(id) {
  if (typeof id !== "string" || !SAFE_ASSET_ID.test(id)) {
    throw new TypeError("Media Desk asset id is invalid");
  }
  const uploadId = id.startsWith("cms-") ? id.slice(4) : id;
  return [
    `src/content/media-catalog/registered/${id}.json`,
    `src/content/media-catalog/uploads/${uploadId}.json`,
  ];
}

export function utf8ToBase64(value) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
