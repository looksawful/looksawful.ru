import { createSupabaseReviewStorage } from "./review-storage-supabase.js";

const CURRENT_POINTER_KEY = "review-hub/v1/current.json";
const ADMIN_REPOSITORY = "looksawful/looksawful.ru";
const TEMP_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;
const MAX_STATE_UPDATE_ATTEMPTS = 5;
const TERMINAL_REVIEW_STATES = new Set(["superseded", "stale", "expired"]);
const CASE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const SHA = /^[0-9a-f]{40}$/u;
const REVIEW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const PROMOTION_ID = REVIEW_ID;
const REVIEW_DEPTHS = new Set(["quick", "interactive", "full"]);
const EVIDENCE_KINDS = new Set(["viewport", "full-page", "component", "diff"]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;

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
  if (typeof value.caseId !== "string" || !CASE_ID.test(value.caseId)) return null;
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
    caseId: value.caseId,
    sourceSha: value.sourceSha,
    reviewDepth: value.reviewDepth,
    capturedAt: value.capturedAt,
    evidence: value.evidence.map(({ id, kind, contentType }) => ({ id, kind, contentType })),
  };
}

function manifestKey(caseId, sourceSha, reviewId) {
  return `review-hub/v1/cases/${caseId}/${sourceSha}/reviews/${reviewId}/manifest.json`;
}

function evidenceKey(caseId, sourceSha, reviewId, evidenceId) {
  return `review-hub/v1/cases/${caseId}/${sourceSha}/reviews/${reviewId}/evidence/${evidenceId}`;
}

function caseStateKey(caseId) {
  return `review-hub/v1/state/${caseId}.json`;
}

function reviewIndexKey(reviewId) {
  return `review-hub/v1/reviews/${reviewId}.json`;
}

function approvalKey(caseId, sourceSha, reviewDepth, reviewId, promotionId) {
  return `review-hub/v1/approvals/${caseId}/${sourceSha}/${reviewDepth}/${reviewId}/${promotionId}.json`;
}

function baselineEvidenceKey(caseId, promotionId, evidenceId) {
  return `review-hub/v1/baselines/${caseId}/objects/${promotionId}/evidence/${evidenceId}`;
}

function baselineEvidenceUrl(caseId, evidenceId) {
  return `/lab/review/baseline/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}`;
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

function reviewDescriptor(manifest, expiresAt = manifest.expiresAt) {
  return {
    version: 1,
    reviewId: manifest.reviewId,
    caseId: manifest.caseId,
    sourceSha: manifest.sourceSha,
    reviewDepth: manifest.reviewDepth,
    capturedAt: manifest.capturedAt,
    expiresAt,
  };
}

function validReviewDescriptor(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.caseId !== "string" || !CASE_ID.test(value.caseId)) return null;
  if (!validReviewRef(value) || !validDate(value.expiresAt)) return null;
  return reviewDescriptor(value);
}

function sameReviewId(left, right) {
  return Boolean(left && right && left.reviewId === right.reviewId);
}

function sameReview(input, review) {
  return (
    input &&
    review &&
    input.reviewId === review.reviewId &&
    input.sourceSha === review.sourceSha &&
    input.reviewDepth === review.reviewDepth &&
    (!("caseId" in input) || input.caseId === review.caseId || review.caseId === undefined)
  );
}

function validBaseline(value, caseId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1 || value.caseId !== caseId) return null;
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
    if (item.url !== baselineEvidenceUrl(caseId, item.id)) return null;
    evidence.push({
      id: item.id,
      kind: item.kind,
      contentType: item.contentType,
      url: item.url,
    });
  }

  return {
    version: 1,
    caseId,
    reviewId: value.reviewId,
    sourceSha: value.sourceSha,
    reviewDepth: value.reviewDepth,
    approvedAt: value.approvedAt,
    approvedBy: value.approvedBy,
    promotionId: value.promotionId,
    evidence,
  };
}

function terminalReviewRecord(reviewId, status, transitionedAt, details = {}) {
  return {
    reviewId,
    status,
    transitionedAt,
    ...(status === "superseded"
      ? { supersededByReviewId: details.supersededByReviewId }
      : {}),
    ...(status === "stale"
      ? { affectingSourceSha: details.affectingSourceSha }
      : {}),
  };
}

function validTerminalReviewRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.reviewId !== "string" || !REVIEW_ID.test(value.reviewId)) return null;
  if (typeof value.status !== "string" || !TERMINAL_REVIEW_STATES.has(value.status)) return null;
  if (!validDate(value.transitionedAt)) return null;

  if (
    value.status === "superseded" &&
    (typeof value.supersededByReviewId !== "string" ||
      !REVIEW_ID.test(value.supersededByReviewId))
  ) {
    return null;
  }
  if (
    value.status === "stale" &&
    (typeof value.affectingSourceSha !== "string" || !SHA.test(value.affectingSourceSha))
  ) {
    return null;
  }

  return terminalReviewRecord(value.reviewId, value.status, value.transitionedAt, value);
}

function emptyCaseState(caseId) {
  return {
    version: 1,
    caseId,
    sourceSha: null,
    current: null,
    history: [],
    baseline: null,
  };
}

function validateCaseState(value, caseId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.version !== 1 || value.caseId !== caseId) return null;

  let current = null;
  if (value.current !== null) {
    if (!validReviewRef(value.current)) return null;
    current = reviewRef(value.current);
  }

  let baseline = null;
  if (value.baseline !== null) {
    baseline = validBaseline(value.baseline, caseId);
    if (!baseline) return null;
  }

  const historyInput = value.history === undefined ? [] : value.history;
  if (!Array.isArray(historyInput)) return null;
  const history = [];
  for (const item of historyInput) {
    const record = validTerminalReviewRecord(item);
    if (!record) return null;
    history.push(record);
  }
  if (new Set(history.map((item) => item.reviewId)).size !== history.length) return null;
  if (current && history.some((item) => item.reviewId === current.reviewId)) return null;

  let sourceSha = value.sourceSha;
  if (sourceSha === undefined || sourceSha === null) {
    sourceSha = current?.sourceSha ?? baseline?.sourceSha ?? null;
  } else if (typeof sourceSha !== "string" || !SHA.test(sourceSha)) {
    return null;
  }

  return {
    version: 1,
    caseId,
    sourceSha,
    current,
    history,
    baseline,
  };
}

async function loadCaseState(bucket, caseId) {
  const object = await bucket.get(caseStateKey(caseId));
  if (!object) return { object: null, state: emptyCaseState(caseId), invalid: false };

  const state = validateCaseState(await readJsonObject(object), caseId);
  if (!state) return { object, state: null, invalid: true };
  return { object, state, invalid: false };
}

async function putCaseState(bucket, caseId, state, object) {
  if (object && typeof object.etag !== "string") return false;

  const options = {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  };
  if (object) options.onlyIf = { etagMatches: object.etag };
  else options.onlyIfAbsent = true;

  const stored = await bucket.put(caseStateKey(caseId), JSON.stringify(state), options);
  return stored !== null;
}

async function putImmutable(bucket, key, value, options = {}) {
  const stored = await bucket.put(key, value, {
    ...options,
    onlyIfAbsent: true,
  });
  if (!stored) throw new Error("Immutable review object already exists.");
  return stored;
}

async function setCaseCurrent(bucket, manifest, nowMs) {
  for (let attempt = 0; attempt < MAX_STATE_UPDATE_ATTEMPTS; attempt += 1) {
    const loaded = await loadCaseState(bucket, manifest.caseId);
    if (loaded.invalid) return "invalid";

    let history = loaded.state.history;
    if (loaded.state.current && !sameReviewId(loaded.state.current, manifest)) {
      history = [
        ...history,
        terminalReviewRecord(
          loaded.state.current.reviewId,
          "superseded",
          new Date(nowMs).toISOString(),
          { supersededByReviewId: manifest.reviewId },
        ),
      ];
    }

    const nextState = {
      ...loaded.state,
      sourceSha: manifest.sourceSha,
      current: reviewRef(manifest),
      history,
    };

    try {
      if (await putCaseState(bucket, manifest.caseId, nextState, loaded.object)) return "ok";
    } catch {
      return "failed";
    }
  }
  return "conflict";
}

async function transitionCurrentReview(
  bucket,
  caseId,
  reviewId,
  status,
  nowMs,
  details = {},
) {
  for (let attempt = 0; attempt < MAX_STATE_UPDATE_ATTEMPTS; attempt += 1) {
    const loaded = await loadCaseState(bucket, caseId);
    if (loaded.invalid) return { result: "invalid" };

    const existing = loaded.state.history.find((item) => item.reviewId === reviewId);
    if (existing) return { result: "already-terminal", record: existing };

    if (!loaded.state.current || loaded.state.current.reviewId !== reviewId) {
      return { result: "not-current" };
    }

    const record = terminalReviewRecord(
      reviewId,
      status,
      new Date(nowMs).toISOString(),
      details,
    );
    const nextState = {
      ...loaded.state,
      ...(status === "stale" ? { sourceSha: details.affectingSourceSha } : {}),
      current: null,
      history: [...loaded.state.history, record],
    };

    try {
      if (await putCaseState(bucket, caseId, nextState, loaded.object)) {
        return { result: "ok", record };
      }
    } catch {
      return { result: "failed" };
    }
  }

  return { result: "conflict" };
}

async function clearCaseCurrentIfMatches(bucket, manifest) {
  for (let attempt = 0; attempt < MAX_STATE_UPDATE_ATTEMPTS; attempt += 1) {
    const loaded = await loadCaseState(bucket, manifest.caseId);
    if (loaded.invalid || !loaded.object || !loaded.state.current) return;
    if (!sameReview(manifest, loaded.state.current)) return;

    const nextState = {
      ...loaded.state,
      current: null,
    };

    try {
      if (await putCaseState(bucket, manifest.caseId, nextState, loaded.object)) return;
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

async function deleteTemporaryEvidence(bucket, manifest) {
  const keys = manifest.evidence.map((item) =>
    evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, item.id),
  );
  await bestEffortDeleteKeys(bucket, keys);
}

async function deleteTemporaryReview(bucket, manifest) {
  const keys = [
    ...manifest.evidence.map((item) =>
      evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, item.id),
    ),
    manifestKey(manifest.caseId, manifest.sourceSha, manifest.reviewId),
    reviewIndexKey(manifest.reviewId),
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
    typeof pointer.caseId !== "string" ||
    !CASE_ID.test(pointer.caseId) ||
    typeof pointer.sourceSha !== "string" ||
    !SHA.test(pointer.sourceSha) ||
    typeof pointer.reviewId !== "string" ||
    !REVIEW_ID.test(pointer.reviewId)
  ) {
    return null;
  }

  const loaded = await loadReviewById(bucket, pointer.reviewId, nowMs);
  if (!loaded || loaded.status !== "current") return null;
  if (
    loaded.manifest.caseId !== pointer.caseId ||
    loaded.manifest.sourceSha !== pointer.sourceSha
  ) {
    return null;
  }
  return loaded.manifest;
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
  const descriptorKey = reviewIndexKey(manifest.reviewId);
  const temporaryKeys = [
    ...manifest.evidence.map((item) =>
      evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, item.id),
    ),
    manifestKey(manifest.caseId, manifest.sourceSha, manifest.reviewId),
    descriptorKey,
  ];

  try {
    await Promise.all(
      uploads.map(({ item, bytes }) =>
        putImmutable(
          bucket,
          evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, item.id),
          bytes,
          {
            httpMetadata: { contentType: item.contentType },
            customMetadata: temporaryMetadata,
          },
        ),
      ),
    );
    await putImmutable(
      bucket,
      manifestKey(manifest.caseId, manifest.sourceSha, manifest.reviewId),
      JSON.stringify(manifest),
      {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      },
    );
    await putImmutable(
      bucket,
      descriptorKey,
      JSON.stringify(reviewDescriptor(manifest, expiresAt)),
      { httpMetadata: { contentType: "application/json; charset=utf-8" } },
    );
  } catch {
    await bestEffortDeleteKeys(bucket, temporaryKeys);
    return text("Private review evidence could not be stored.", 503);
  }

  const stateResult = await setCaseCurrent(bucket, manifest, nowMs);
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
        caseId: manifest.caseId,
        sourceSha: manifest.sourceSha,
        reviewId: manifest.reviewId,
      }),
      { httpMetadata: { contentType: "application/json; charset=utf-8" } },
    );
  } catch {
    // Case state is authoritative. The global pointer is only latest-review discovery.
  }

  return json(clientManifest(manifest), 201);
}

async function loadReviewById(bucket, reviewId, nowMs) {
  const descriptorObject = await bucket.get(reviewIndexKey(reviewId));
  if (!descriptorObject) return null;

  const descriptor = validReviewDescriptor(await readJsonObject(descriptorObject));
  if (!descriptor || descriptor.reviewId !== reviewId) return null;

  const manifestObject = await bucket.get(
    manifestKey(descriptor.caseId, descriptor.sourceSha, descriptor.reviewId),
  );
  if (!manifestObject) return null;

  const manifest = validateReviewManifest(await readJsonObject(manifestObject));
  if (
    !manifest ||
    manifest.reviewId !== descriptor.reviewId ||
    manifest.caseId !== descriptor.caseId ||
    manifest.sourceSha !== descriptor.sourceSha ||
    manifest.reviewDepth !== descriptor.reviewDepth
  ) {
    return null;
  }

  let loadedState = await loadCaseState(bucket, descriptor.caseId);
  if (loadedState.invalid) return { descriptor, manifest, status: "invalid" };

  const terminal = loadedState.state.history.find((item) => item.reviewId === reviewId);
  if (terminal) return { descriptor, manifest, status: terminal.status, terminal };

  if (!loadedState.state.current || loadedState.state.current.reviewId !== reviewId) {
    return { descriptor, manifest, status: "unavailable" };
  }

  if (Date.parse(descriptor.expiresAt) <= nowMs) {
    await deleteTemporaryEvidence(bucket, manifest);

    if (!sameReviewId(loadedState.state.baseline, manifest)) {
      const transition = await transitionCurrentReview(
        bucket,
        descriptor.caseId,
        reviewId,
        "expired",
        Date.parse(descriptor.expiresAt),
      );
      if (transition.result === "ok" || transition.result === "already-terminal") {
        return { descriptor, manifest, status: "expired", terminal: transition.record };
      }

      loadedState = await loadCaseState(bucket, descriptor.caseId);
      if (loadedState.invalid) return { descriptor, manifest, status: "invalid" };
      const racedTerminal = loadedState.state.history.find(
        (item) => item.reviewId === reviewId,
      );
      if (racedTerminal) {
        return {
          descriptor,
          manifest,
          status: racedTerminal.status,
          terminal: racedTerminal,
        };
      }
      if (!loadedState.state.current || loadedState.state.current.reviewId !== reviewId) {
        return { descriptor, manifest, status: "unavailable" };
      }
    }
  }

  return { descriptor, manifest, status: "current" };
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
    evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, evidenceId),
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
    REVIEW_ID.test(value.reviewId)
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

function publicBaseline(baseline, sourceSha = baseline.sourceSha) {
  return {
    version: baseline.version,
    caseId: baseline.caseId,
    reviewId: baseline.reviewId,
    sourceSha: baseline.sourceSha,
    reviewDepth: baseline.reviewDepth,
    approvedAt: baseline.approvedAt,
    approvedBy: baseline.approvedBy,
    valid: sourceSha === baseline.sourceSha,
  };
}

function baselineEvidenceKeys(baseline) {
  if (!baseline) return [];
  return baseline.evidence.map((item) =>
    baselineEvidenceKey(baseline.caseId, baseline.promotionId, item.id),
  );
}

async function approveReview(request, bucket, session, nowMs) {
  if (session?.repository !== ADMIN_REPOSITORY) {
    return text("Approval requires the repository owner.", 403);
  }

  const input = await readApprovalInput(request);
  if (input.error === 415) return text("Expected JSON approval request.", 415);
  if (input.error) return text("Approval request is invalid.", 400);

  const loadedReview = await loadReviewById(bucket, input.value.reviewId, nowMs);
  if (!loadedReview) {
    return text("Review is unavailable.", 409);
  }
  if (loadedReview.status === "expired") {
    return json({ reviewId: input.value.reviewId, status: "expired" }, 410);
  }
  if (loadedReview.status === "superseded" || loadedReview.status === "stale") {
    return json({ reviewId: input.value.reviewId, status: loadedReview.status }, 409);
  }
  if (loadedReview.status !== "current") {
    return text("Review is unavailable.", 409);
  }

  const manifest = loadedReview.manifest;
  const loadedState = await loadCaseState(bucket, manifest.caseId);
  if (loadedState.invalid) return text("Case review state is invalid.", 503);
  if (
    !loadedState.object ||
    typeof loadedState.object.etag !== "string" ||
    !loadedState.state.current ||
    !sameReviewId(manifest, loadedState.state.current)
  ) {
    return text("Review is stale or no longer current.", 409);
  }

  const existingBaseline = loadedState.state.baseline;
  if (existingBaseline && sameReviewId(manifest, existingBaseline)) {
    return json(publicBaseline(existingBaseline, loadedState.state.sourceSha), 200);
  }

  const copies = [];
  for (const item of manifest.evidence) {
    const source = await bucket.get(
      evidenceKey(manifest.caseId, manifest.sourceSha, manifest.reviewId, item.id),
    );
    if (!source || objectExpired(source, nowMs)) {
      return text("Review evidence is incomplete or expired.", 409);
    }
    copies.push({ item, source });
  }

  const promotionId = newPromotionId();
  const durableEvidenceKeys = copies.map(({ item }) =>
    baselineEvidenceKey(manifest.caseId, promotionId, item.id),
  );
  const approval = {
    version: 1,
    caseId: manifest.caseId,
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
      url: baselineEvidenceUrl(manifest.caseId, item.id),
    })),
  };
  const recordKey = approvalKey(
    manifest.caseId,
    manifest.sourceSha,
    manifest.reviewDepth,
    manifest.reviewId,
    promotionId,
  );

  try {
    await Promise.all(
      copies.map(({ item, source }) =>
        putImmutable(
          bucket,
          baselineEvidenceKey(manifest.caseId, promotionId, item.id),
          source.body,
          { httpMetadata: { contentType: item.contentType } },
        ),
      ),
    );
    await putImmutable(bucket, recordKey, JSON.stringify(approval), {
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
    promoted = await putCaseState(bucket, manifest.caseId, nextState, loadedState.object);
  } catch {
    const observed = await loadCaseState(bucket, manifest.caseId);
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

  return json(publicBaseline(baseline, manifest.sourceSha), 201);
}

async function getBaseline(request, bucket) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId") ?? "";
  if (!CASE_ID.test(caseId)) return text("Case baseline not found.", 404);

  const loaded = await loadCaseState(bucket, caseId);
  if (loaded.invalid) return text("Case baseline state is invalid.", 503);
  if (!loaded.state.baseline) return text("Case baseline not found.", 404);
  return json(publicBaseline(loaded.state.baseline, loaded.state.sourceSha));
}

async function getBaselineEvidence(pathname, bucket) {
  const prefix = "/lab/review/baseline/";
  const suffix = pathname.slice(prefix.length);
  const parts = suffix.split("/");
  if (parts.length !== 3 || parts[1] !== "evidence") {
    return text("Baseline evidence not found.", 404);
  }

  const [caseId, , evidenceId] = parts;
  if (!CASE_ID.test(caseId) || !EVIDENCE_ID.test(evidenceId)) {
    return text("Baseline evidence not found.", 404);
  }

  const loaded = await loadCaseState(bucket, caseId);
  if (loaded.invalid) return text("Baseline evidence state is invalid.", 503);
  const baseline = loaded.state.baseline;
  if (!baseline) return text("Baseline evidence not found.", 404);

  const descriptor = baseline.evidence.find((item) => item.id === evidenceId);
  if (!descriptor) return text("Baseline evidence not found.", 404);

  const object = await bucket.get(
    baselineEvidenceKey(caseId, baseline.promotionId, evidenceId),
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

export async function markCurrentReviewStale({
  env,
  caseId,
  affectingSourceSha,
  now = Date.now,
}) {
  if (
    typeof caseId !== "string" ||
    !CASE_ID.test(caseId) ||
    typeof affectingSourceSha !== "string" ||
    !SHA.test(affectingSourceSha)
  ) {
    return null;
  }

  const bucket = reviewStorage(env);
  if (!bucket) return null;

  const loaded = await loadCaseState(bucket, caseId);
  if (loaded.invalid || !loaded.state.current) return null;
  if (loaded.state.current.sourceSha === affectingSourceSha) return null;

  const reviewId = loaded.state.current.reviewId;
  const nowMs = typeof now === "function" ? now() : Date.now();
  const transitioned = await transitionCurrentReview(
    bucket,
    caseId,
    reviewId,
    "stale",
    nowMs,
    { affectingSourceSha },
  );

  if (
    transitioned.result === "ok" ||
    (transitioned.result === "already-terminal" &&
      transitioned.record?.status === "stale")
  ) {
    return { reviewId, status: "stale" };
  }
  return null;
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