import { createSupabaseReviewStorage } from "./review-storage-supabase.js";

const CURRENT_POINTER_KEY = "review-hub/v1/current.json";
const ADMIN_REPOSITORY = "looksawful/looksawful.ru";
const TEMP_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;
const MAX_STATE_UPDATE_ATTEMPTS = 5;
const REVIEW_TARGET_ID = /^[a-z][a-z0-9-]*(?::[a-z0-9][a-z0-9-]{0,95})?$/u;
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const SHA = /^[0-9a-f]{40}$/u;
const REVIEW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const PROMOTION_ID = REVIEW_ID;
const REVIEW_DEPTHS = new Set(["quick", "interactive", "full"]);
const EVIDENCE_KINDS = new Set(["viewport", "full-page", "component", "diff"]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function text(message, status, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...extraHeaders,
    },
  });
}

function reviewStorage(env) {
  const injected = env?.REVIEW_STORAGE;
  if (
    injected &&
    typeof injected.get === "function" &&
    typeof injected.put === "function"
  ) {
    return injected;
  }
  return createSupabaseReviewStorage(env);
}

async function cleanupExpired(storage) {
  if (typeof storage?.cleanupExpired !== "function") return;
  try {
    await storage.cleanupExpired(200);
  } catch {
    // Retention cleanup is best effort; request authorization/data access still fail closed.
  }
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validEvidence(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    EVIDENCE_ID.test(value.id) &&
    typeof value.kind === "string" &&
    EVIDENCE_KINDS.has(value.kind) &&
    typeof value.contentType === "string" &&
    IMAGE_TYPES.has(value.contentType)
  );
}

export function validateReviewManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.reviewTargetId !== "string" || !REVIEW_TARGET_ID.test(value.reviewTargetId)) return null;
  if (typeof value.sourceSha !== "string" || !SHA.test(value.sourceSha)) return null;
  if (typeof value.reviewDepth !== "string" || !REVIEW_DEPTHS.has(value.reviewDepth)) return null;
  if (!validDate(value.capturedAt)) return null;
  if (!Array.isArray(value.evidence) || value.evidence.length === 0 || value.evidence.length > 32) {
    return null;
  }
  if (!value.evidence.every(validEvidence)) return null;
  if (new Set(value.evidence.map((item) => item.id)).size !== value.evidence.length) return null;

  const reviewId =
    typeof value.reviewId === "string" && REVIEW_ID.test(value.reviewId)
      ? value.reviewId
      : null;

  return {
    version: 1,
    ...(reviewId === null ? {} : { reviewId }),
    reviewTargetId: value.reviewTargetId,
    sourceSha: value.sourceSha,
    reviewDepth: value.reviewDepth,
    capturedAt: value.capturedAt,
    evidence: value.evidence.map(({ id, kind, contentType }) => ({ id, kind, contentType })),
  };
}

function manifestKey(reviewTargetId, sourceSha, reviewId) {
  return `review-hub/v1/targets/${encodeURIComponent(reviewTargetId)}/${sourceSha}/reviews/${reviewId}/manifest.json`;
}

function evidenceKey(reviewTargetId, sourceSha, reviewId, evidenceId) {
  return `review-hub/v1/targets/${encodeURIComponent(reviewTargetId)}/${sourceSha}/reviews/${reviewId}/evidence/${evidenceId}`;
}

function caseStateKey(reviewTargetId) {
  return `review-hub/v1/state/${encodeURIComponent(reviewTargetId)}.json`;
}

function approvalKey(reviewTargetId, sourceSha, reviewDepth, reviewId, promotionId) {
  return `review-hub/v1/approvals/${encodeURIComponent(reviewTargetId)}/${sourceSha}/${reviewDepth}/${reviewId}/${promotionId}.json`;
}

function baselineEvidenceKey(reviewTargetId, promotionId, evidenceId) {
  return `review-hub/v1/baselines/${encodeURIComponent(reviewTargetId)}/objects/${promotionId}/evidence/${evidenceId}`;
}

function baselineEvidenceUrl(reviewTargetId, evidenceId) {
  return `/lab/review/baseline/${encodeURIComponent(reviewTargetId)}/evidence/${encodeURIComponent(evidenceId)}`;
}

async function readJsonObject(object) {
  try {
    return JSON.parse(await object.text());
  } catch {
    return null;
  }
}

function objectExpired(object, nowMs) {
  const expiresAt = object?.customMetadata?.expiresAt;
  return typeof expiresAt === "string" && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) <= nowMs;
}

function reviewRef(manifest) {
  return {
    reviewId: manifest.reviewId,
    sourceSha: manifest.sourceSha,
    reviewDepth: manifest.reviewDepth,
    capturedAt: manifest.capturedAt,
  };
}

function validReviewRef(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.reviewId === "string" &&
    REVIEW_ID.test(value.reviewId) &&
    typeof value.sourceSha === "string" &&
    SHA.test(value.sourceSha) &&
    typeof value.reviewDepth === "string" &&
    REVIEW_DEPTHS.has(value.reviewDepth) &&
    validDate(value.capturedAt)
  );
}

function sameReview(input, review) {
  return (
    input &&
    review &&
    input.reviewId === review.reviewId &&
    input.sourceSha === review.sourceSha &&
    input.reviewDepth === review.reviewDepth &&
    (!("reviewTargetId" in input) || input.reviewTargetId === review.reviewTargetId || review.reviewTargetId === undefined)
  );
}

function validBaseline(value, reviewTargetId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1 || value.reviewTargetId !== reviewTargetId) return null;
  if (typeof value.reviewId !== "string" || !REVIEW_ID.test(value.reviewId)) return null;
  if (typeof value.sourceSha !== "string" || !SHA.test(value.sourceSha)) return null;
  if (typeof value.reviewDepth !== "string" || !REVIEW_DEPTHS.has(value.reviewDepth)) return null;
  if (!validDate(value.approvedAt)) return null;
  if (typeof value.approvedBy !== "string" || value.approvedBy.length === 0) return null;
  if (typeof value.promotionId !== "string" || !PROMOTION_ID.test(value.promotionId)) return null;
  if (!Array.isArray(value.evidence) || value.evidence.length === 0 || value.evidence.length > 32) {
    return null;
  }

  const evidence = [];
  for (const item of value.evidence) {
    if (!validEvidence(item)) return null;
    if (item.url !== baselineEvidenceUrl(reviewTargetId, item.id)) return null;
    evidence.push({
      id: item.id,
      kind: item.kind,
      contentType: item.contentType,
      url: item.url,
    });
  }

  return {
    version: 1,
    reviewTargetId,
    reviewId: value.reviewId,
    sourceSha: value.sourceSha,
    reviewDepth: value.reviewDepth,
    approvedAt: value.approvedAt,
    approvedBy: value.approvedBy,
    promotionId: value.promotionId,
    evidence,
  };
}

function emptyCaseState(reviewTargetId) {
  return {
    version: 1,
    reviewTargetId,
    current: null,
    baseline: null,
  };
}

function validateCaseState(value, reviewTargetId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1 || value.reviewTargetId !== reviewTargetId) return null;

  let current = null;
  if (value.current !== null) {
    if (!validReviewRef(value.current)) return null;
    current = reviewRef(value.current);
  }

  let baseline = null;
  if (value.baseline !== null) {
    baseline = validBaseline(value.baseline, reviewTargetId);
    if (!baseline) return null;
  }

  return {
    version: 1,
    reviewTargetId,
    current,
    baseline,
  };
}

async function loadCaseState(bucket, reviewTargetId) {
  const object = await bucket.get(caseStateKey(reviewTargetId));
  if (!object) return { object: null, state: emptyCaseState(reviewTargetId), invalid: false };

  const state = validateCaseState(await readJsonObject(object), reviewTargetId);
  if (!state) return { object, state: null, invalid: true };
  return { object, state, invalid: false };
}

async function putCaseState(bucket, reviewTargetId, state, object) {
  if (object && typeof object.etag !== "string") return false;

  const options = {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  };
  if (object) options.onlyIf = { etagMatches: object.etag };

  const stored = await bucket.put(caseStateKey(reviewTargetId), JSON.stringify(state), options);
  return stored !== null;
}

async function setCaseCurrent(bucket, manifest) {
  for (let attempt = 0; attempt < MAX_STATE_UPDATE_ATTEMPTS; attempt += 1) {
    const loaded = await loadCaseState(bucket, manifest.reviewTargetId);
    if (loaded.invalid) return "invalid";

    const nextState = {
      ...loaded.state,
      current: reviewRef(manifest),
    };

    try {
      if (await putCaseState(bucket, manifest.reviewTargetId, nextState, loaded.object)) return "ok";
    } catch {
      return "failed";
    }
  }
  return "conflict";
}

async function clearCaseCurrentIfMatches(bucket, manifest) {
  for (let attempt = 0; attempt < MAX_STATE_UPDATE_ATTEMPTS; attempt += 1) {
    const loaded = await loadCaseState(bucket, manifest.reviewTargetId);
    if (loaded.invalid || !loaded.object || !loaded.state.current) return;
    if (!sameReview(manifest, loaded.state.current)) return;

    const nextState = {
      ...loaded.state,
      current: null,
    };

    try {
      if (await putCaseState(bucket, manifest.reviewTargetId, nextState, loaded.object)) return;
    } catch {
      return;
    }
  }
}

async function deleteKeys(bucket, keys) {
  if (typeof bucket.delete === "function" && keys.length > 0) await bucket.delete(keys);
}

async function bestEffortDeleteKeys(bucket, keys) {
  try {
    await deleteKeys(bucket, keys);
  } catch {
    // Unreachable staged objects are safer than deleting a visible baseline.
  }
}

async function deleteTemporaryReview(bucket, manifest) {
  const keys = [
    ...manifest.evidence.map((item) =>
      evidenceKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId, item.id),
    ),
    manifestKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId),
  ];
  await bestEffortDeleteKeys(bucket, keys);
  await clearCaseCurrentIfMatches(bucket, manifest);
}

async function loadCurrentManifest(bucket, nowMs) {
  const pointerObject = await bucket.get(CURRENT_POINTER_KEY);
  if (!pointerObject) return null;
  const pointer = await readJsonObject(pointerObject);
  if (
    !pointer ||
    typeof pointer.reviewTargetId !== "string" ||
    !REVIEW_TARGET_ID.test(pointer.reviewTargetId) ||
    typeof pointer.sourceSha !== "string" ||
    !SHA.test(pointer.sourceSha) ||
    typeof pointer.reviewId !== "string" ||
    !REVIEW_ID.test(pointer.reviewId)
  ) {
    return null;
  }

  const manifestObject = await bucket.get(
    manifestKey(pointer.reviewTargetId, pointer.sourceSha, pointer.reviewId),
  );
  if (!manifestObject) return null;
  const manifest = validateReviewManifest(await readJsonObject(manifestObject));
  if (!manifest || typeof manifest.reviewId !== "string") return null;
  if (
    manifest.reviewTargetId !== pointer.reviewTargetId ||
    manifest.sourceSha !== pointer.sourceSha ||
    manifest.reviewId !== pointer.reviewId
  ) {
    return null;
  }
  if (objectExpired(manifestObject, nowMs)) {
    await deleteTemporaryReview(bucket, manifest);
    return null;
  }
  return manifest;
}

function clientManifest(manifest) {
  return {
    ...manifest,
    evidence: manifest.evidence.map((item) => ({
      ...item,
      url: `/lab/review/evidence/${encodeURIComponent(item.id)}`,
    })),
  };
}

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    typeof value.type === "string" &&
    typeof value.size === "number"
  );
}

async function createReview(request, bucket, nowMs) {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return text("Expected multipart review evidence.", 415);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return text("Invalid multipart review evidence.", 400);
  }

  const rawManifest = form.get("manifest");
  if (typeof rawManifest !== "string") return text("Review manifest is required.", 400);

  let parsedManifest;
  try {
    parsedManifest = JSON.parse(rawManifest);
  } catch {
    return text("Review manifest is invalid JSON.", 400);
  }
  const validatedManifest = validateReviewManifest(parsedManifest);
  if (!validatedManifest) return text("Review manifest is invalid.", 400);
  const manifest = {
    ...validatedManifest,
    reviewId: crypto.randomUUID(),
  };

  const uploads = [];
  for (const item of manifest.evidence) {
    const file = form.get(item.id);
    if (!isFileLike(file)) return text(`Evidence ${item.id} is required.`, 400);
    if (file.type !== item.contentType) return text(`Evidence ${item.id} content type mismatch.`, 400);
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
      return text(`Evidence ${item.id} size is invalid.`, 400);
    }
    uploads.push({ item, bytes: await file.arrayBuffer() });
  }

  const expiresAt = new Date(nowMs + TEMP_RETENTION_MS).toISOString();
  const temporaryMetadata = { expiresAt };
  const temporaryKeys = [
    ...manifest.evidence.map((item) =>
      evidenceKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId, item.id),
    ),
    manifestKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId),
  ];

  try {
    await Promise.all(
      uploads.map(({ item, bytes }) =>
        bucket.put(
          evidenceKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId, item.id),
          bytes,
          {
          httpMetadata: { contentType: item.contentType },
          customMetadata: temporaryMetadata,
          },
        ),
      ),
    );
    await bucket.put(
      manifestKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId),
      JSON.stringify(manifest),
      {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
        customMetadata: temporaryMetadata,
      },
    );
  } catch {
    await bestEffortDeleteKeys(bucket, temporaryKeys);
    return text("Private review evidence could not be stored.", 503);
  }

  const stateResult = await setCaseCurrent(bucket, manifest);
  if (stateResult !== "ok") {
    await bestEffortDeleteKeys(bucket, temporaryKeys);
    return text(
      stateResult === "conflict"
        ? "Case review state changed during capture."
        : "Case review state is unavailable.",
      stateResult === "conflict" ? 409 : 503,
    );
  }

  try {
    await bucket.put(
      CURRENT_POINTER_KEY,
      JSON.stringify({
        reviewTargetId: manifest.reviewTargetId,
        sourceSha: manifest.sourceSha,
        reviewId: manifest.reviewId,
      }),
      { httpMetadata: { contentType: "application/json; charset=utf-8" } },
    );
  } catch {
    await deleteTemporaryReview(bucket, manifest);
    return text("Private review pointer could not be stored.", 503);
  }

  return json(clientManifest(manifest), 201);
}

async function getCurrentReview(bucket, nowMs) {
  const manifest = await loadCurrentManifest(bucket, nowMs);
  if (!manifest) return text("No current private review.", 404);
  return json(clientManifest(manifest));
}

async function getEvidence(pathname, bucket, nowMs) {
  const prefix = "/lab/review/evidence/";
  const evidenceId = pathname.slice(prefix.length);
  if (!EVIDENCE_ID.test(evidenceId)) return text("Review evidence not found.", 404);

  const manifest = await loadCurrentManifest(bucket, nowMs);
  if (!manifest) return text("Review evidence not found.", 404);
  const descriptor = manifest.evidence.find((item) => item.id === evidenceId);
  if (!descriptor) return text("Review evidence not found.", 404);

  const object = await bucket.get(
    evidenceKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId, evidenceId),
  );
  if (!object || objectExpired(object, nowMs)) return text("Review evidence not found.", 404);

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": descriptor.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function validApprovalInput(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.reviewId === "string" &&
    REVIEW_ID.test(value.reviewId) &&
    typeof value.reviewTargetId === "string" &&
    REVIEW_TARGET_ID.test(value.reviewTargetId) &&
    typeof value.sourceSha === "string" &&
    SHA.test(value.sourceSha) &&
    typeof value.reviewDepth === "string" &&
    REVIEW_DEPTHS.has(value.reviewDepth)
  );
}

async function readApprovalInput(request) {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return { error: 415 };

  let value;
  try {
    value = await request.json();
  } catch {
    return { error: 400 };
  }
  if (!validApprovalInput(value)) return { error: 400 };
  return { value };
}

function newPromotionId() {
  return crypto.randomUUID();
}

function publicBaseline(baseline) {
  return {
    version: baseline.version,
    reviewTargetId: baseline.reviewTargetId,
    reviewId: baseline.reviewId,
    sourceSha: baseline.sourceSha,
    reviewDepth: baseline.reviewDepth,
    approvedAt: baseline.approvedAt,
    approvedBy: baseline.approvedBy,
  };
}

function baselineEvidenceKeys(baseline) {
  if (!baseline) return [];
  return baseline.evidence.map((item) =>
    baselineEvidenceKey(baseline.reviewTargetId, baseline.promotionId, item.id),
  );
}

async function approveReview(request, bucket, session, nowMs) {
  if (session?.repository !== ADMIN_REPOSITORY) {
    return text("Approval requires the repository owner.", 403);
  }

  const input = await readApprovalInput(request);
  if (input.error === 415) return text("Expected JSON approval request.", 415);
  if (input.error) return text("Approval request is invalid.", 400);

  const manifest = await loadCurrentManifest(bucket, nowMs);
  if (!manifest || !sameReview(input.value, manifest) || input.value.reviewTargetId !== manifest.reviewTargetId) {
    return text("Review is stale or no longer current.", 409);
  }

  const loadedState = await loadCaseState(bucket, manifest.reviewTargetId);
  if (loadedState.invalid) return text("Case review state is invalid.", 503);
  if (
    !loadedState.object ||
    typeof loadedState.object.etag !== "string" ||
    !loadedState.state.current ||
    !sameReview(input.value, loadedState.state.current)
  ) {
    return text("Review is stale or no longer current.", 409);
  }

  const existingBaseline = loadedState.state.baseline;
  if (existingBaseline && sameReview(input.value, existingBaseline)) {
    return json(publicBaseline(existingBaseline), 200);
  }

  const copies = [];
  for (const item of manifest.evidence) {
    const source = await bucket.get(
      evidenceKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId, item.id),
    );
    if (!source || objectExpired(source, nowMs)) {
      return text("Review evidence is incomplete or expired.", 409);
    }
    copies.push({ item, source });
  }

  const promotionId = newPromotionId();
  const durableEvidenceKeys = copies.map(({ item }) =>
    baselineEvidenceKey(manifest.reviewTargetId, promotionId, item.id),
  );
  const approval = {
    version: 1,
    reviewTargetId: manifest.reviewTargetId,
    reviewId: manifest.reviewId,
    sourceSha: manifest.sourceSha,
    reviewDepth: manifest.reviewDepth,
    approvedAt: new Date(nowMs).toISOString(),
    approvedBy: "repository-owner",
  };
  const baseline = {
    ...approval,
    promotionId,
    evidence: manifest.evidence.map((item) => ({
      ...item,
      url: baselineEvidenceUrl(manifest.reviewTargetId, item.id),
    })),
  };
  const recordKey = approvalKey(
    manifest.reviewTargetId,
    manifest.sourceSha,
    manifest.reviewDepth,
    manifest.reviewId,
    promotionId,
  );

  try {
    await Promise.all(
      copies.map(({ item, source }) =>
        bucket.put(
          baselineEvidenceKey(manifest.reviewTargetId, promotionId, item.id),
          source.body,
          { httpMetadata: { contentType: item.contentType } },
        ),
      ),
    );
    await bucket.put(recordKey, JSON.stringify(approval), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
  } catch {
    await bestEffortDeleteKeys(bucket, [...durableEvidenceKeys, recordKey]);
    return text("Baseline evidence promotion failed.", 503);
  }

  const nextState = {
    ...loadedState.state,
    baseline,
  };

  let promoted;
  try {
    promoted = await putCaseState(bucket, manifest.reviewTargetId, nextState, loadedState.object);
  } catch {
    const observed = await loadCaseState(bucket, manifest.reviewTargetId);
    if (!observed.invalid && observed.state?.baseline?.promotionId === promotionId) {
      promoted = true;
    } else {
      await bestEffortDeleteKeys(bucket, [...durableEvidenceKeys, recordKey]);
      return text("Baseline promotion failed.", 503);
    }
  }

  if (!promoted) {
    await bestEffortDeleteKeys(bucket, [...durableEvidenceKeys, recordKey]);
    return text("Review changed before approval could complete.", 409);
  }

  const previousBaselineKeys = baselineEvidenceKeys(loadedState.state.baseline);
  if (previousBaselineKeys.length > 0) {
    await bestEffortDeleteKeys(bucket, previousBaselineKeys);
  }

  return json(publicBaseline(baseline), 201);
}

async function getBaseline(request, bucket) {
  const url = new URL(request.url);
  const reviewTargetId = url.searchParams.get("reviewTargetId") ?? "";
  if (!REVIEW_TARGET_ID.test(reviewTargetId)) return text("Case baseline not found.", 404);

  const loaded = await loadCaseState(bucket, reviewTargetId);
  if (loaded.invalid) return text("Case baseline state is invalid.", 503);
  if (!loaded.state.baseline) return text("Case baseline not found.", 404);
  return json(publicBaseline(loaded.state.baseline));
}

async function getBaselineEvidence(pathname, bucket) {
  const prefix = "/lab/review/baseline/";
  const suffix = pathname.slice(prefix.length);
  const parts = suffix.split("/");
  if (parts.length !== 3 || parts[1] !== "evidence") {
    return text("Baseline evidence not found.", 404);
  }

  const [reviewTargetId, , evidenceId] = parts;
  if (!REVIEW_TARGET_ID.test(reviewTargetId) || !EVIDENCE_ID.test(evidenceId)) {
    return text("Baseline evidence not found.", 404);
  }

  const loaded = await loadCaseState(bucket, reviewTargetId);
  if (loaded.invalid) return text("Baseline evidence state is invalid.", 503);
  const baseline = loaded.state.baseline;
  if (!baseline) return text("Baseline evidence not found.", 404);

  const descriptor = baseline.evidence.find((item) => item.id === evidenceId);
  if (!descriptor) return text("Baseline evidence not found.", 404);

  const object = await bucket.get(
    baselineEvidenceKey(reviewTargetId, baseline.promotionId, evidenceId),
  );
  if (!object) return text("Baseline evidence not found.", 404);

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": descriptor.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function handleReviewRequest({ request, env, session = null, now = Date.now }) {
  const url = new URL(request.url);
  const isApi = url.pathname === "/lab/review/api";
  const isEvidence = url.pathname.startsWith("/lab/review/evidence/");
  const isApproval = url.pathname === "/lab/review/approval";
  const isBaseline = url.pathname === "/lab/review/baseline";
  const isBaselineEvidence = url.pathname.startsWith("/lab/review/baseline/");

  if (!isApi && !isEvidence && !isApproval && !isBaseline && !isBaselineEvidence) return null;

  const bucket = reviewStorage(env);
  if (!bucket) return text("Private review storage is not configured.", 503);
  const nowMs = typeof now === "function" ? now() : Date.now();

  await cleanupExpired(bucket);

  if (isApi && request.method === "GET") return getCurrentReview(bucket, nowMs);
  if (isApi && request.method === "POST") return createReview(request, bucket, nowMs);
  if (isEvidence && request.method === "GET") return getEvidence(url.pathname, bucket, nowMs);
  if (isApproval && request.method === "POST") return approveReview(request, bucket, session, nowMs);
  if (isBaseline && request.method === "GET") return getBaseline(request, bucket);
  if (isBaselineEvidence && request.method === "GET") {
    return getBaselineEvidence(url.pathname, bucket);
  }

  const allow = isApi ? "GET, POST" : isApproval ? "POST" : "GET";
  return text("Method not allowed.", 405, { Allow: allow });
}