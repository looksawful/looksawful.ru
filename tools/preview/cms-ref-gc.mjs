import { DEFAULT_CMS_PREVIEW_TTL_HOURS } from "./source-contract.mjs";

const EXACT_SHA = /^[0-9a-f]{40}$/i;
const CMS_REF = /^refs\/heads\/cms-preview\/([a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?)$/;

export const CMS_PREVIEW_TTL_HOURS = DEFAULT_CMS_PREVIEW_TTL_HOURS;
export const DEFAULT_CMS_REF_MAX_DELETES = 10;
export const HARD_CMS_REF_MAX_DELETES = 25;

function validateMaxDeletes(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > HARD_CMS_REF_MAX_DELETES) {
    throw new Error(`maxDeletes must be an integer from 0 to ${HARD_CMS_REF_MAX_DELETES}`);
  }
}

function normalizeRef(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError("CMS preview ref must be an object");
  const match = typeof item.ref === "string" ? item.ref.match(CMS_REF) : null;
  if (!match) throw new Error("CMS preview ref is outside the disposable namespace");
  if (typeof item.sha !== "string" || !EXACT_SHA.test(item.sha)) throw new Error("CMS preview ref must use an exact SHA");
  const committedMs = Date.parse(item.committed_at);
  if (!Number.isFinite(committedMs)) throw new Error("CMS preview ref must have a valid commit timestamp");
  return {
    id: match[1],
    ref: item.ref,
    sha: item.sha.toLowerCase(),
    committed_at: new Date(committedMs).toISOString(),
    committed_ms: committedMs,
  };
}

function publicRef(item) {
  const { committed_ms: _committedMs, ...value } = item;
  return value;
}

export function cmsRefDeleteLeaseArgument(ref, expectedSha) {
  if (typeof ref !== "string" || !CMS_REF.test(ref)) throw new Error("CMS preview delete ref is outside the disposable namespace");
  if (typeof expectedSha !== "string" || !EXACT_SHA.test(expectedSha)) throw new Error("CMS preview delete lease requires an exact SHA");
  return `--force-with-lease=${ref}:${expectedSha.toLowerCase()}`;
}

export function classifyCmsRefDeleteFailure({ expectedSha, remoteSha }) {
  if (typeof expectedSha !== "string" || !EXACT_SHA.test(expectedSha)) {
    throw new Error("CMS preview delete classification requires an exact SHA");
  }
  if (remoteSha === null) return "already-gone";
  if (typeof remoteSha !== "string" || !EXACT_SHA.test(remoteSha)) {
    throw new Error("CMS preview remote delete state must be null or an exact SHA");
  }
  return remoteSha.toLowerCase() === expectedSha.toLowerCase()
    ? "unexpected-push-failure"
    : "refreshed";
}

export function planCmsRefGc({ refs = [], now = Date.now(), maxDeletes = DEFAULT_CMS_REF_MAX_DELETES } = {}) {
  if (!Array.isArray(refs)) throw new TypeError("refs must be an array");
  if (!Number.isFinite(now)) throw new TypeError("now must be a finite epoch timestamp");
  validateMaxDeletes(maxDeletes);

  const seenRefs = new Set();
  const normalized = refs.map((item) => {
    const value = normalizeRef(item);
    if (seenRefs.has(value.ref)) throw new Error(`duplicate CMS preview ref: ${value.ref}`);
    seenRefs.add(value.ref);
    return value;
  });

  const expiresBeforeOrAt = now - CMS_PREVIEW_TTL_HOURS * 60 * 60 * 1000;
  const expired = normalized
    .filter((item) => item.committed_ms <= expiresBeforeOrAt)
    .sort((a, b) => a.committed_ms - b.committed_ms || a.ref.localeCompare(b.ref, "en"));
  const retain = normalized
    .filter((item) => item.committed_ms > expiresBeforeOrAt)
    .sort((a, b) => a.ref.localeCompare(b.ref, "en"));

  return {
    ttl_hours: CMS_PREVIEW_TTL_HOURS,
    max_deletes: maxDeletes,
    retain: retain.map(publicRef),
    delete: expired.slice(0, maxDeletes).map(publicRef),
    deferred_delete: expired.slice(maxDeletes).map(publicRef),
  };
}
