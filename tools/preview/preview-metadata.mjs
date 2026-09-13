const PREVIEW_KINDS = new Set(["feature", "lab", "cms", "release"]);
const ALLOWED_FIELDS = new Set(["repository", "sha", "kind", "key", "pr"]);
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

function parseInput(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`invalid preview metadata JSON: ${error.message}`);
  }
}

function assertRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("preview metadata must be an object");
  }
}

export function parsePreviewMetadata(input) {
  const value = parseInput(input);
  assertRecord(value);

  for (const field of Object.keys(value)) {
    if (!ALLOWED_FIELDS.has(field)) {
      throw new Error(`unknown preview metadata field: ${field}`);
    }
  }

  const repository = value.repository;
  if (typeof repository !== "string" || !REPOSITORY_PATTERN.test(repository)) {
    throw new Error("preview metadata repository must be an owner/name repository slug");
  }

  const sha = value.sha;
  if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) {
    throw new Error("preview metadata sha must be an exact 40-character hexadecimal commit SHA");
  }

  const kind = value.kind;
  if (typeof kind !== "string" || !PREVIEW_KINDS.has(kind)) {
    throw new Error("preview metadata kind must be one of: feature, lab, cms, release");
  }

  const key = value.key;
  if (typeof key !== "string" || !KEY_PATTERN.test(key)) {
    throw new Error("preview metadata key must be a lowercase slug of 1-63 characters");
  }

  if (value.pr !== undefined && (!Number.isSafeInteger(value.pr) || value.pr <= 0)) {
    throw new Error("preview metadata pr must be a positive safe integer when supplied");
  }

  return {
    repository,
    sha: sha.toLowerCase(),
    kind,
    key,
    ...(value.pr === undefined ? {} : { pr: value.pr }),
  };
}

export const previewMetadataContract = Object.freeze({
  kinds: Object.freeze([...PREVIEW_KINDS]),
  keyPattern: KEY_PATTERN,
});
