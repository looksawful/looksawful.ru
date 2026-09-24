import { sitePages } from "../../src/site/pages/manifest.ts";
import { createCloudflareReviewStorage } from "./review-storage-cloudflare.js";

const CURRENT_POINTER_KEY = "review-hub/v1/current.json";
const TEMP_RETENTION_MS = 4 * 24 * 60 * 60 * 1000;
const REVIEW_TARGET_ID = /^[a-z][a-z0-9-]*(?::[a-z0-9][a-z0-9-]{0,95})?$/u;
const THIN_SLICE_REVIEW_TARGET_ID = "project:awful-mockups";
const CANONICAL_REVIEW_TARGET_IDS = new Set(
  sitePages.filter((page) => page.enabled).map((page) => page.id),
);
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const SHA = /^[0-9a-f]{40}$/u;
const REVIEW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
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
  return createCloudflareReviewStorage(env);
}

async function cleanupExpired(storage) {
  if (typeof storage?.cleanupExpired !== "function") return;
  try {
    await storage.cleanupExpired(200);
  } catch {
    // Opportunistic cleanup never weakens request fail-closed behavior.
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
  if (
    typeof value.reviewTargetId !== "string" ||
    !REVIEW_TARGET_ID.test(value.reviewTargetId) ||
    !CANONICAL_REVIEW_TARGET_IDS.has(value.reviewTargetId) ||
    value.reviewTargetId !== THIN_SLICE_REVIEW_TARGET_ID
  ) {
    return null;
  }
  if (typeof value.sourceSha !== "string" || !SHA.test(value.sourceSha)) return null;
  if (
    typeof value.reviewDepth !== "string" ||
    !REVIEW_DEPTHS.has(value.reviewDepth)
  ) {
    return null;
  }
  if (!validDate(value.capturedAt)) return null;
  if (
    !Array.isArray(value.evidence) ||
    value.evidence.length === 0 ||
    value.evidence.length > 32
  ) {
    return null;
  }
  if (!value.evidence.every(validEvidence)) return null;
  if (new Set(value.evidence.map((item) => item.id)).size !== value.evidence.length) {
    return null;
  }

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
    evidence: value.evidence.map(({ id, kind, contentType }) => ({
      id,
      kind,
      contentType,
    })),
  };
}

function targetSegment(reviewTargetId) {
  return encodeURIComponent(reviewTargetId);
}

function manifestKey(reviewTargetId, sourceSha, reviewId) {
  return `review-hub/v1/targets/${targetSegment(reviewTargetId)}/${sourceSha}/reviews/${reviewId}/manifest.json`;
}

function evidenceKey(reviewTargetId, sourceSha, reviewId, evidenceId) {
  return `review-hub/v1/targets/${targetSegment(reviewTargetId)}/${sourceSha}/reviews/${reviewId}/evidence/${evidenceId}`;
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
  return (
    typeof expiresAt === "string" &&
    Number.isFinite(Date.parse(expiresAt)) &&
    Date.parse(expiresAt) <= nowMs
  );
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

async function deleteReview(storage, manifest, currentPointerEtag) {
  if (typeof storage.delete !== "function") return;
  const keys = [
    ...manifest.evidence.map((item) =>
      evidenceKey(
        manifest.reviewTargetId,
        manifest.sourceSha,
        manifest.reviewId,
        item.id,
      ),
    ),
    manifestKey(manifest.reviewTargetId, manifest.sourceSha, manifest.reviewId),
  ];
  try {
    await storage.delete(keys);
  } catch {
    // Cleanup is best effort; inaccessible evidence is safer than false success.
  }

  if (
    typeof currentPointerEtag === "string" &&
    typeof storage.deleteIfMatch === "function"
  ) {
    try {
      await storage.deleteIfMatch(CURRENT_POINTER_KEY, currentPointerEtag);
    } catch {
      // A stale cleanup must never remove or invalidate a newer Current pointer.
    }
  }
}

async function loadCurrentManifest(storage, nowMs) {
  const pointerObject = await storage.get(CURRENT_POINTER_KEY);
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

  const object = await storage.get(
    manifestKey(pointer.reviewTargetId, pointer.sourceSha, pointer.reviewId),
  );
  if (!object) return null;

  const manifest = validateReviewManifest(await readJsonObject(object));
  if (
    !manifest ||
    manifest.reviewId !== pointer.reviewId ||
    manifest.reviewTargetId !== pointer.reviewTargetId ||
    manifest.sourceSha !== pointer.sourceSha
  ) {
    return null;
  }

  if (objectExpired(object, nowMs)) {
    await deleteReview(storage, manifest, pointerObject.etag);
    return null;
  }

  return manifest;
}

async function createReview(request, storage, nowMs) {
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
  if (typeof rawManifest !== "string") {
    return text("Review manifest is required.", 400);
  }

  let parsedManifest;
  try {
    parsedManifest = JSON.parse(rawManifest);
  } catch {
    return text("Review manifest is invalid JSON.", 400);
  }

  const validated = validateReviewManifest(parsedManifest);
  if (!validated) return text("Review manifest is invalid.", 400);

  const manifest = {
    ...validated,
    reviewId: crypto.randomUUID(),
  };

  const uploads = [];
  for (const item of manifest.evidence) {
    const file = form.get(item.id);
    if (!isFileLike(file)) return text(`Evidence ${item.id} is required.`, 400);
    if (file.type !== item.contentType) {
      return text(`Evidence ${item.id} content type mismatch.`, 400);
    }
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
      return text(`Evidence ${item.id} size is invalid.`, 400);
    }
    uploads.push({ item, bytes: await file.arrayBuffer() });
  }

  const expiresAt = new Date(nowMs + TEMP_RETENTION_MS).toISOString();
  const writtenKeys = [];

  try {
    for (const { item, bytes } of uploads) {
      const key = evidenceKey(
        manifest.reviewTargetId,
        manifest.sourceSha,
        manifest.reviewId,
        item.id,
      );
      await storage.put(key, bytes, {
        httpMetadata: { contentType: item.contentType },
        customMetadata: { expiresAt },
      });
      writtenKeys.push(key);
    }

    const manifestStorageKey = manifestKey(
      manifest.reviewTargetId,
      manifest.sourceSha,
      manifest.reviewId,
    );
    await storage.put(manifestStorageKey, JSON.stringify(manifest), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: { expiresAt },
    });
    writtenKeys.push(manifestStorageKey);

    await storage.put(
      CURRENT_POINTER_KEY,
      JSON.stringify({
        reviewTargetId: manifest.reviewTargetId,
        sourceSha: manifest.sourceSha,
        reviewId: manifest.reviewId,
      }),
      { httpMetadata: { contentType: "application/json; charset=utf-8" } },
    );
  } catch {
    if (typeof storage.delete === "function" && writtenKeys.length > 0) {
      try {
        await storage.delete(writtenKeys);
      } catch {}
    }
    return text("Private review evidence could not be stored.", 503);
  }

  return json(clientManifest(manifest), 201);
}

async function getCurrentReview(storage, nowMs) {
  const manifest = await loadCurrentManifest(storage, nowMs);
  if (!manifest) return text("No current private review.", 404);
  return json(clientManifest(manifest));
}

async function getEvidence(pathname, storage, nowMs) {
  const prefix = "/lab/review/evidence/";
  const evidenceId = pathname.slice(prefix.length);
  if (!EVIDENCE_ID.test(evidenceId)) return text("Review evidence not found.", 404);

  const manifest = await loadCurrentManifest(storage, nowMs);
  if (!manifest) return text("Review evidence not found.", 404);

  const descriptor = manifest.evidence.find((item) => item.id === evidenceId);
  if (!descriptor) return text("Review evidence not found.", 404);

  const object = await storage.get(
    evidenceKey(
      manifest.reviewTargetId,
      manifest.sourceSha,
      manifest.reviewId,
      evidenceId,
    ),
  );
  if (!object || objectExpired(object, nowMs)) {
    return text("Review evidence not found.", 404);
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": descriptor.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function handleReviewRequest({ request, env, now = Date.now }) {
  const url = new URL(request.url);
  const isApi = url.pathname === "/lab/review/api";
  const isEvidence = url.pathname.startsWith("/lab/review/evidence/");
  if (!isApi && !isEvidence) return null;

  const storage = reviewStorage(env);
  if (!storage) return text("Private review storage is not configured.", 503);

  const nowMs = typeof now === "function" ? now() : Date.now();
  await cleanupExpired(storage);

  if (isApi && request.method === "GET") {
    return getCurrentReview(storage, nowMs);
  }
  if (isApi && request.method === "POST") {
    return createReview(request, storage, nowMs);
  }
  if (isEvidence && request.method === "GET") {
    return getEvidence(url.pathname, storage, nowMs);
  }

  return text("Method not allowed.", 405, {
    Allow: isApi ? "GET, POST" : "GET",
  });
}
