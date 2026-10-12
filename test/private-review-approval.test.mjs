import assert from "node:assert/strict";
import test from "node:test";

import { handleReviewRequest } from "../lab/functions/review.js";

const CASE_ID = "awful-mockups";
const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
const STALE_SHA = "1111111111111111111111111111111111111111";
const SUPERSEDED_SHA = "2222222222222222222222222222222222222222";
const NOW = Date.parse("2026-09-21T15:00:00.000Z");
const FOUR_DAYS_LATER = "2026-09-25T15:00:00.000Z";
const OWNER_SESSION = { repository: "looksawful/looksawful.ru" };
const REVIEW_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SECOND_REVIEW_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SUPERSEDED_REVIEW_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function reviewIdFor(sourceSha) {
  return sourceSha === SUPERSEDED_SHA ? SUPERSEDED_REVIEW_ID : REVIEW_ID;
}

class MemoryReviewStorage {
  #objects = new Map();
  #version = 0;
  #failPutKey = null;
  #beforePutKey = null;
  #beforePut = null;

  failNextPutFor(key) {
    this.#failPutKey = key;
  }

  beforeNextPutFor(key, callback) {
    this.#beforePutKey = key;
    this.#beforePut = callback;
  }

  async put(key, value, options = {}) {
    if (this.#beforePutKey === key && this.#beforePut !== null) {
      const callback = this.#beforePut;
      this.#beforePutKey = null;
      this.#beforePut = null;
      await callback();
    }
    if (this.#failPutKey === key) {
      this.#failPutKey = null;
      throw new Error("synthetic R2 put failure");
    }
    const existing = this.#objects.get(key);
    if (
      typeof options.onlyIf?.etagMatches === "string" &&
      existing?.etag !== options.onlyIf.etagMatches
    ) {
      return null;
    }
    const bytes =
      typeof value === "string"
        ? new TextEncoder().encode(value)
        : value instanceof ArrayBuffer
          ? new Uint8Array(value)
          : value instanceof Uint8Array
            ? value
            : new Uint8Array(await new Response(value).arrayBuffer());
    const etag = `etag-${++this.#version}`;
    const object = {
      key,
      bytes,
      etag,
      httpMetadata: options.httpMetadata ?? {},
      customMetadata: options.customMetadata ?? {},
    };
    this.#objects.set(key, object);
    return object;
  }

  async get(key) {
    const object = this.#objects.get(key);
    if (!object) return null;
    return {
      key: object.key,
      body: object.bytes,
      etag: object.etag,
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata,
      text: async () => new TextDecoder().decode(object.bytes),
    };
  }

  async delete(keys) {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.#objects.delete(key);
  }

  object(key) {
    return this.#objects.get(key) ?? null;
  }

  objectsWithPrefix(prefix) {
    return [...this.#objects.values()].filter((object) => object.key.startsWith(prefix));
  }
}

function reviewManifest(sourceSha = SOURCE_SHA, reviewId = reviewIdFor(sourceSha)) {
  return {
    version: 1,
    reviewId,
    caseId: CASE_ID,
    sourceSha,
    reviewDepth: "quick",
    capturedAt: "2026-09-21T14:59:00.000Z",
    evidence: [{ id: "desktop", kind: "viewport", contentType: "image/png" }],
  };
}

function uploadRequest(sourceSha = SOURCE_SHA, reviewId = reviewIdFor(sourceSha)) {
  const form = new FormData();
  form.set("manifest", JSON.stringify(reviewManifest(sourceSha, reviewId)));
  form.set("desktop", new File(["private-image"], "desktop.png", { type: "image/png" }));
  return new Request("https://admin.looksawful.ru/lab/review/api", {
    method: "POST",
    body: form,
  });
}

function approvalRequest(sourceSha = SOURCE_SHA, reviewId = reviewIdFor(sourceSha)) {
  return new Request("https://admin.looksawful.ru/lab/review/approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewId,
      caseId: CASE_ID,
      sourceSha,
      reviewDepth: "quick",
    }),
  });
}

async function createReview(bucket, sourceSha = SOURCE_SHA, now = NOW, reviewId = reviewIdFor(sourceSha)) {
  const response = await handleReviewRequest({
    request: uploadRequest(sourceSha, reviewId),
    env: { REVIEW_STORAGE: bucket },
    now: () => now,
  });
  assert.equal(response.status, 201);
}

test("approval is owner-only and promotes an exact Case+SHA baseline", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);

  const forbidden = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    now: () => NOW,
  });
  assert.equal(forbidden.status, 403);

  const approved = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(approved.status, 201);
  const payload = await approved.json();
  assert.equal(payload.promotionId, undefined, "private promotion identifiers must not leak");
  assert.equal(payload.reviewId, REVIEW_ID);
  assert.deepEqual(
    {
      caseId: payload.caseId,
      sourceSha: payload.sourceSha,
      reviewDepth: payload.reviewDepth,
      approvedAt: payload.approvedAt,
    },
    {
      caseId: CASE_ID,
      sourceSha: SOURCE_SHA,
      reviewDepth: "quick",
      approvedAt: "2026-09-21T15:00:00.000Z",
    },
  );

  const state = bucket.object(`review-hub/v1/state/${CASE_ID}.json`);
  assert.ok(state, "Case state must persist");
  const statePayload = JSON.parse(new TextDecoder().decode(state.bytes));
  assert.equal(statePayload.current.sourceSha, SOURCE_SHA);
  assert.equal(statePayload.baseline.sourceSha, SOURCE_SHA);
  assert.equal(statePayload.baseline.reviewDepth, "quick");
  assert.equal(
    statePayload.baseline.evidence[0].url,
    `/lab/review/baseline/${CASE_ID}/evidence/desktop`,
  );

  const durableEvidence = bucket.objectsWithPrefix(
    `review-hub/v1/baselines/${CASE_ID}/objects/`,
  );
  assert.equal(durableEvidence.length, 1, "approved baseline evidence must be durable");
  assert.equal(new TextDecoder().decode(durableEvidence[0].bytes), "private-image");

  const approvals = bucket.objectsWithPrefix(
    `review-hub/v1/approvals/${CASE_ID}/${SOURCE_SHA}/quick/`,
  );
  assert.equal(approvals.length, 1, "compact approval record must persist separately");

  const baselineResponse = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline?caseId=${CASE_ID}`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(baselineResponse.status, 200);
  const publicBaseline = await baselineResponse.json();
  assert.equal(publicBaseline.promotionId, undefined, "private storage identifiers must not leak");

  const baselineEvidence = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline/${CASE_ID}/evidence/desktop`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(baselineEvidence.status, 200);
  assert.equal(await baselineEvidence.text(), "private-image");
});

test("same-SHA recapture cannot approve a different Review than the one displayed", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket, SOURCE_SHA, NOW, REVIEW_ID);
  await createReview(bucket, SOURCE_SHA, NOW + 500, SECOND_REVIEW_ID);

  const staleDisplayedReview = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, REVIEW_ID),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(staleDisplayedReview.status, 409);

  const currentReview = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, SECOND_REVIEW_ID),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(currentReview.status, 201);
  assert.equal((await currentReview.json()).reviewId, SECOND_REVIEW_ID);
});

test("stale SHA approval fails closed and cannot replace the Case baseline", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);

  const stale = await handleReviewRequest({
    request: approvalRequest(STALE_SHA),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(stale.status, 409);
  const state = bucket.object(`review-hub/v1/state/${CASE_ID}.json`);
  assert.ok(state);
  assert.equal(JSON.parse(new TextDecoder().decode(state.bytes)).baseline, null);
  assert.equal(
    bucket.objectsWithPrefix(
      `review-hub/v1/approvals/${CASE_ID}/${STALE_SHA}/quick/`,
    ).length,
    0,
  );
});

test("temporary review evidence carries four-day retention while approved copies do not", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);

  const temporaryEvidence = bucket.object(
    `review-hub/v1/cases/${CASE_ID}/reviews/${REVIEW_ID}/evidence/desktop`,
  );
  assert.equal(temporaryEvidence?.customMetadata?.expiresAt, FOUR_DAYS_LATER);

  await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });

  const durableEvidence = bucket.objectsWithPrefix(
    `review-hub/v1/baselines/${CASE_ID}/objects/`,
  );
  assert.equal(durableEvidence.length, 1);
  assert.deepEqual(durableEvidence[0]?.customMetadata ?? {}, {});

  const expiredReview = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 4 * 24 * 60 * 60 * 1000,
  });
  assert.equal(expiredReview.status, 404);
  assert.equal(
    bucket.object(`review-hub/v1/cases/${CASE_ID}/reviews/${REVIEW_ID}/evidence/desktop`),
    null,
  );
  assert.equal(
    bucket.objectsWithPrefix(
      `review-hub/v1/approvals/${CASE_ID}/${SOURCE_SHA}/quick/`,
    ).length,
    1,
    "compact approval record must outlive temporary evidence",
  );
  assert.equal(
    bucket.objectsWithPrefix(`review-hub/v1/baselines/${CASE_ID}/objects/`).length,
    1,
    "approved baseline evidence must outlive temporary evidence",
  );
});


test("Review Hub approval UI binds the displayed review and handles stale approval explicitly", async () => {
  const { readFile } = await import("node:fs/promises");
  const [html, client] = await Promise.all([
    readFile(new URL("../lab/review/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/review.ts", import.meta.url), "utf8"),
  ]);

  assert.match(html, /id="review-approve"/);
  assert.match(html, /id="review-approval-status"/);
  assert.match(client, /\/lab\/review\/approval/);
  assert.match(client, /reviewId:\s*manifest\.reviewId/);
  assert.match(client, /caseId:\s*manifest\.caseId/);
  assert.match(client, /sourceSha:\s*manifest\.sourceSha/);
  assert.match(client, /reviewDepth:\s*manifest\.reviewDepth/);
  assert.match(client, /response\.status === 409/);
});


test("failed final baseline promotion rolls back durable copies and approval record", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);
  bucket.failNextPutFor(`review-hub/v1/state/${CASE_ID}.json`);

  const response = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });

  assert.equal(response.status, 503);
  const failedState = bucket.object(`review-hub/v1/state/${CASE_ID}.json`);
  assert.ok(failedState);
  assert.equal(JSON.parse(new TextDecoder().decode(failedState.bytes)).baseline, null);
  assert.equal(
    bucket.objectsWithPrefix(
      `review-hub/v1/approvals/${CASE_ID}/${SOURCE_SHA}/quick/`,
    ).length,
    0,
  );
  assert.equal(
    bucket.objectsWithPrefix(`review-hub/v1/baselines/${CASE_ID}/objects/`).length,
    0,
  );
});


test("failed re-approval never destroys the previously visible Case baseline", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);

  const first = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(first.status, 201);

  bucket.failNextPutFor(`review-hub/v1/state/${CASE_ID}.json`);
  const second = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(second.status, 503);

  const baselineEvidence = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline/${CASE_ID}/evidence/desktop`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(baselineEvidence.status, 200);
  assert.equal(await baselineEvidence.text(), "private-image");
});


test("superseding review during the final Case promotion makes approval fail closed", async () => {
  const bucket = new MemoryReviewStorage();
  await createReview(bucket);

  bucket.beforeNextPutFor(
    `review-hub/v1/state/${CASE_ID}.json`,
    async () => {
      await createReview(bucket, SUPERSEDED_SHA, NOW + 500);
    },
  );

  const response = await handleReviewRequest({
    request: approvalRequest(),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });

  assert.equal(response.status, 409);

  const current = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(current.status, 200);
  assert.equal((await current.json()).sourceSha, SUPERSEDED_SHA);

  const baseline = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline?caseId=${CASE_ID}`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(baseline.status, 404);
});
