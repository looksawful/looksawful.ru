const CURRENT_POINTER_KEY = "review-hub/v1/current.json";
const ADMIN_REPOSITORY = "looksawful/looksawful.ru";
const TEMP_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;
const CASE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const SHA = /^[0-9a-f]{40}$/u;
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

function reviewBucket(env) {
  const bucket = env?.REVIEW_EVIDENCE;
  if (!bucket || typeof bucket.get !== "function" || typeof bucket.put !== "function") return null;
  return bucket;
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

  return {
    version: 1,
    caseId: value.caseId,
    sourceSha: value.sourceSha,
    reviewDepth: value.reviewDepth,
    capturedAt: value.capturedAt,
    evidence: value.evidence.map(({ id, kind, contentType }) => ({ id, kind, contentType })),
  };
}

function manifestKey(caseId, sourceSha) {
  return `review-hub/v1/cases/${caseId}/${sourceSha}/manifest.json`;
}

function evidenceKey(caseId, sourceSha, evidenceId) {
  return `review-hub/v1/cases/${caseId}/${sourceSha}/evidence/${evidenceId}`;
}

function approvalKey(caseId, sourceSha, reviewDepth) {
  return `review-hub/v1/approvals/${caseId}/${sourceSha}/${reviewDepth}.json`;
}

function baselineKey(caseId) {
  return `review-hub/v1/baselines/${caseId}.json`;
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

async function deleteTemporaryReview(bucket, manifest) {
  if (typeof bucket.delete !== "function") return;
  const keys = [
    ...manifest.evidence.map((item) => evidenceKey(manifest.caseId, manifest.sourceSha, item.id)),
    manifestKey(manifest.caseId, manifest.sourceSha),
    CURRENT_POINTER_KEY,
  ];
  await bucket.delete(keys);
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
    !SHA.test(pointer.sourceSha)
  ) {
    return null;
  }

  const manifestObject = await bucket.get(manifestKey(pointer.caseId, pointer.sourceSha));
  if (!manifestObject) return null;
  const manifest = validateReviewManifest(await readJsonObject(manifestObject));
  if (!manifest) return null;
  if (manifest.caseId !== pointer.caseId || manifest.sourceSha !== pointer.sourceSha) return null;
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
  const manifest = validateReviewManifest(parsedManifest);
  if (!manifest) return text("Review manifest is invalid.", 400);

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

  await Promise.all(
    uploads.map(({ item, bytes }) =>
      bucket.put(evidenceKey(manifest.caseId, manifest.sourceSha, item.id), bytes, {
        httpMetadata: { contentType: item.contentType },
        customMetadata: temporaryMetadata,
      }),
    ),
  );
  await bucket.put(manifestKey(manifest.caseId, manifest.sourceSha), JSON.stringify(manifest), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: temporaryMetadata,
  });
  await bucket.put(
    CURRENT_POINTER_KEY,
    JSON.stringify({ caseId: manifest.caseId, sourceSha: manifest.sourceSha }),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );

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

  const object = await bucket.get(evidenceKey(manifest.caseId, manifest.sourceSha, evidenceId));
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
    typeof value.caseId === "string" &&
    CASE_ID.test(value.caseId) &&
    typeof value.sourceSha === "string" &&
    SHA.test(value.sourceSha) &&
    typeof value.reviewDepth === "string" &&
    REVIEW_DEPTHS.has(value.reviewDepth)
  );
}

function sameReview(input, manifest) {
  return (
    input.caseId === manifest.caseId &&
    input.sourceSha === manifest.sourceSha &&
    input.reviewDepth === manifest.reviewDepth
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

async function deleteKeys(bucket, keys) {
  if (typeof bucket.delete === "function" && keys.length > 0) await bucket.delete(keys);
}

function newPromotionId() {
  return crypto.randomUUID();
}

function publicBaseline(baseline) {
  return {
    version: baseline.version,
    caseId: baseline.caseId,
    sourceSha: baseline.sourceSha,
    reviewDepth: baseline.reviewDepth,
    approvedAt: baseline.approvedAt,
    approvedBy: baseline.approvedBy,
  };
}

async function approveReview(request, bucket, session, nowMs) {
  if (session?.repository !== ADMIN_REPOSITORY) return text("Approval requires the repository owner.", 403);

  const input = await readApprovalInput(request);
  if (input.error === 415) return text("Expected JSON approval request.", 415);
  if (input.error) return text("Approval request is invalid.", 400);

  const manifest = await loadCurrentManifest(bucket, nowMs);
  if (!manifest || !sameReview(input.value, manifest)) {
    return text("Review is stale or no longer current.", 409);
  }

  const copies = [];
  for (const item of manifest.evidence) {
    const source = await bucket.get(evidenceKey(manifest.caseId, manifest.sourceSha, item.id));
    if (!source || objectExpired(source, nowMs)) {
      return text("Review evidence is incomplete or expired.", 409);
    }
    copies.push({ item, source });
  }

  const promotionId = newPromotionId();
  const durableEvidenceKeys = copies.map(({ item }) =>
    baselineEvidenceKey(manifest.caseId, promotionId, item.id),
  );
  try {
    await Promise.all(
      copies.map(({ item, source }) =>
        bucket.put(
          baselineEvidenceKey(manifest.caseId, promotionId, item.id),
          source.body,
          { httpMetadata: { contentType: item.contentType } },
        ),
      ),
    );
  } catch {
    await deleteKeys(bucket, durableEvidenceKeys);
    return text("Baseline evidence promotion failed.", 503);
  }

  const stillCurrent = await loadCurrentManifest(bucket, nowMs);
  if (!stillCurrent || !sameReview(input.value, stillCurrent)) {
    await deleteKeys(bucket, durableEvidenceKeys);
    return text("Review changed before approval could complete.", 409);
  }

  const approval = {
    version: 1,
    caseId: manifest.caseId,
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

  const recordKey = approvalKey(manifest.caseId, manifest.sourceSha, manifest.reviewDepth);
  try {
    await bucket.put(recordKey, JSON.stringify(approval), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
    await bucket.put(baselineKey(manifest.caseId), JSON.stringify(baseline), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
  } catch {
    await deleteKeys(bucket, [...durableEvidenceKeys, recordKey]);
    return text("Baseline promotion failed.", 503);
  }

  return json(baseline, 201);
}

async function getBaseline(request, bucket) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId") ?? "";
  if (!CASE_ID.test(caseId)) return text("Case baseline not found.", 404);
  const object = await bucket.get(baselineKey(caseId));
  if (!object) return text("Case baseline not found.", 404);
  const baseline = await readJsonObject(object);
  if (
    !baseline ||
    baseline.caseId !== caseId ||
    typeof baseline.sourceSha !== "string" ||
    typeof baseline.promotionId !== "string"
  ) {
    return text("Case baseline not found.", 404);
  }
  return json(publicBaseline(baseline));
}

async function getBaselineEvidence(pathname, bucket) {
  const prefix = "/lab/review/baseline/";
  const suffix = pathname.slice(prefix.length);
  const parts = suffix.split("/");
  if (parts.length !== 3 || parts[1] !== "evidence") return text("Baseline evidence not found.", 404);
  const [caseId, , evidenceId] = parts;
  if (!CASE_ID.test(caseId) || !EVIDENCE_ID.test(evidenceId)) {
    return text("Baseline evidence not found.", 404);
  }

  const baselineObject = await bucket.get(baselineKey(caseId));
  if (!baselineObject) return text("Baseline evidence not found.", 404);
  const baseline = await readJsonObject(baselineObject);
  if (
    !baseline ||
    !SHA.test(baseline.sourceSha ?? "") ||
    typeof baseline.promotionId !== "string" ||
    !/^[0-9a-f-]{36}$/u.test(baseline.promotionId)
  ) {
    return text("Baseline evidence not found.", 404);
  }
  const descriptor = Array.isArray(baseline.evidence)
    ? baseline.evidence.find((item) => item?.id === evidenceId && validEvidence(item))
    : null;
  if (!descriptor) return text("Baseline evidence not found.", 404);

  const object = await bucket.get(baselineEvidenceKey(caseId, baseline.promotionId, evidenceId));
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

  const bucket = reviewBucket(env);
  if (!bucket) return text("Private review storage is not configured.", 503);
  const nowMs = typeof now === "function" ? now() : Date.now();

  if (isApi && request.method === "GET") return getCurrentReview(bucket, nowMs);
  if (isApi && request.method === "POST") return createReview(request, bucket, nowMs);
  if (isEvidence && request.method === "GET") return getEvidence(url.pathname, bucket, nowMs);
  if (isApproval && request.method === "POST") return approveReview(request, bucket, session, nowMs);
  if (isBaseline && request.method === "GET") return getBaseline(request, bucket);
  if (isBaselineEvidence && request.method === "GET") return getBaselineEvidence(url.pathname, bucket);

  const allow = isApi ? "GET, POST" : isApproval ? "POST" : "GET";
  return text("Method not allowed.", 405, { Allow: allow });
}
