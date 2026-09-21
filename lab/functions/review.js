const CURRENT_POINTER_KEY = "review-hub/v1/current.json";
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

async function readJsonObject(object) {
  try {
    return JSON.parse(await object.text());
  } catch {
    return null;
  }
}

async function loadCurrentManifest(bucket) {
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

async function createReview(request, bucket) {
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
    uploads.push({ item, file, bytes: await file.arrayBuffer() });
  }

  await Promise.all(
    uploads.map(({ item, bytes }) =>
      bucket.put(evidenceKey(manifest.caseId, manifest.sourceSha, item.id), bytes, {
        httpMetadata: { contentType: item.contentType },
      }),
    ),
  );
  await bucket.put(manifestKey(manifest.caseId, manifest.sourceSha), JSON.stringify(manifest), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  await bucket.put(
    CURRENT_POINTER_KEY,
    JSON.stringify({ caseId: manifest.caseId, sourceSha: manifest.sourceSha }),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );

  return json(clientManifest(manifest), 201);
}

async function getCurrentReview(bucket) {
  const manifest = await loadCurrentManifest(bucket);
  if (!manifest) return text("No current private review.", 404);
  return json(clientManifest(manifest));
}

async function getEvidence(pathname, bucket) {
  const prefix = "/lab/review/evidence/";
  const evidenceId = pathname.slice(prefix.length);
  if (!EVIDENCE_ID.test(evidenceId)) return text("Review evidence not found.", 404);

  const manifest = await loadCurrentManifest(bucket);
  if (!manifest) return text("Review evidence not found.", 404);
  const descriptor = manifest.evidence.find((item) => item.id === evidenceId);
  if (!descriptor) return text("Review evidence not found.", 404);

  const object = await bucket.get(evidenceKey(manifest.caseId, manifest.sourceSha, evidenceId));
  if (!object) return text("Review evidence not found.", 404);

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": descriptor.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function handleReviewRequest({ request, env }) {
  const url = new URL(request.url);
  const isApi = url.pathname === "/lab/review/api";
  const isEvidence = url.pathname.startsWith("/lab/review/evidence/");
  if (!isApi && !isEvidence) return null;

  const bucket = reviewBucket(env);
  if (!bucket) return text("Private review storage is not configured.", 503);

  if (isApi && request.method === "GET") return getCurrentReview(bucket);
  if (isApi && request.method === "POST") return createReview(request, bucket);
  if (isEvidence && request.method === "GET") return getEvidence(url.pathname, bucket);

  return text("Method not allowed.", 405, { Allow: isApi ? "GET, POST" : "GET" });
}
