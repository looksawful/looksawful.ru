import assert from "node:assert/strict";
import test from "node:test";

import {
  handleReviewRequest,
  markCurrentReviewStale,
} from "../lab/functions/review.js";

const CASE_ID = "awful-mockups";
const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
const STALE_SHA = "1111111111111111111111111111111111111111";
const SUPERSEDED_SHA = "2222222222222222222222222222222222222222";
const NOW = Date.parse("2026-09-21T15:00:00.000Z");
const FOUR_DAYS_LATER = "2026-09-25T15:00:00.000Z";
const OWNER_SESSION = { repository: "looksawful/looksawful.ru" };

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

function reviewManifest(sourceSha = SOURCE_SHA) {
  return {
    version: 1,
    caseId: CASE_ID,
    sourceSha,
    reviewDepth: "quick",
    capturedAt: "2026-09-21T14:59:00.000Z",
    evidence: [{ id: "desktop", kind: "viewport", contentType: "image/png" }],
  };
}

function uploadRequest(sourceSha = SOURCE_SHA) {
  const form = new FormData();
  form.set("manifest", JSON.stringify(reviewManifest(sourceSha)));
  form.set("desktop", new File(["private-image"], "desktop.png", { type: "image/png" }));
  return new Request("https://admin.looksawful.ru/lab/review/api", {
    method: "POST",
    body: form,
  });
}

function approvalRequest(sourceSha = SOURCE_SHA, reviewId = undefined) {
  return new Request("https://admin.looksawful.ru/lab/review/approval", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caseId: CASE_ID,
      sourceSha,
      reviewDepth: "quick",
      ...(reviewId === undefined ? {} : { reviewId }),
    }),
  });
}

async function createReview(bucket, sourceSha = SOURCE_SHA, now = NOW) {
  const response = await handleReviewRequest({
    request: uploadRequest(sourceSha),
    env: { REVIEW_STORAGE: bucket },
    now: () => now,
  });
  assert.equal(response.status, 201);
  return response.json();
}

test("approval is owner-only and promotes an exact Case+SHA baseline", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const forbidden = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
    env: { REVIEW_STORAGE: bucket },
    now: () => NOW,
  });
  assert.equal(forbidden.status, 403);

  const approved = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(approved.status, 201);
  const payload = await approved.json();
  assert.equal(payload.promotionId, undefined, "private promotion identifiers must not leak");
  assert.deepEqual(
    {
      reviewId: payload.reviewId,
      caseId: payload.caseId,
      sourceSha: payload.sourceSha,
      reviewDepth: payload.reviewDepth,
      approvedAt: payload.approvedAt,
    },
    {
      reviewId: review.reviewId,
      caseId: CASE_ID,
      sourceSha: SOURCE_SHA,
      reviewDepth: "quick",
      approvedAt: "2026-09-21T15:00:00.000Z",
    },
  );

  const state = bucket.object(`review-hub/v1/state/${CASE_ID}.json`);
  assert.ok(state, "Case state must persist");
  const statePayload = JSON.parse(new TextDecoder().decode(state.bytes));
  assert.equal(statePayload.current.reviewId, review.reviewId);
  assert.equal(statePayload.current.sourceSha, SOURCE_SHA);
  assert.equal(statePayload.baseline.reviewId, review.reviewId);
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

test("owner approval accepts immutable Review ID without Case SHA or depth", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const approved = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });

  assert.equal(approved.status, 201);
  assert.equal((await approved.json()).reviewId, review.reviewId);
});


test("repeating approval for the same exact Review is idempotent", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const first = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(first.status, 201);
  const firstPayload = await first.json();

  const firstState = JSON.parse(
    new TextDecoder().decode(bucket.object(`review-hub/v1/state/${CASE_ID}.json`).bytes),
  );
  const firstApprovalKeys = bucket
    .objectsWithPrefix(`review-hub/v1/approvals/${CASE_ID}/${SOURCE_SHA}/quick/`)
    .map(({ key }) => key)
    .sort();
  const firstBaselineKeys = bucket
    .objectsWithPrefix(`review-hub/v1/baselines/${CASE_ID}/objects/`)
    .map(({ key }) => key)
    .sort();

  bucket.failNextPutFor(`review-hub/v1/state/${CASE_ID}.json`);
  const second = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 60_000,
  });
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), firstPayload);

  const secondState = JSON.parse(
    new TextDecoder().decode(bucket.object(`review-hub/v1/state/${CASE_ID}.json`).bytes),
  );
  assert.equal(secondState.baseline.promotionId, firstState.baseline.promotionId);
  assert.equal(secondState.baseline.approvedAt, firstState.baseline.approvedAt);
  assert.deepEqual(
    bucket
      .objectsWithPrefix(`review-hub/v1/approvals/${CASE_ID}/${SOURCE_SHA}/quick/`)
      .map(({ key }) => key)
      .sort(),
    firstApprovalKeys,
  );
  assert.deepEqual(
    bucket
      .objectsWithPrefix(`review-hub/v1/baselines/${CASE_ID}/objects/`)
      .map(({ key }) => key)
      .sort(),
    firstBaselineKeys,
  );
});

test("stale SHA approval fails closed and cannot replace the Case baseline", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const stale = await handleReviewRequest({
    request: approvalRequest(STALE_SHA, review.reviewId),
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
  const review = await createReview(bucket);

  const temporaryEvidence = bucket.object(
    `review-hub/v1/cases/${CASE_ID}/${SOURCE_SHA}/reviews/${review.reviewId}/evidence/desktop`,
  );
  assert.equal(temporaryEvidence?.customMetadata?.expiresAt, FOUR_DAYS_LATER);

  await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
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
  assert.equal(expiredReview.status, 200);
  assert.equal((await expiredReview.json()).reviewId, review.reviewId);
  assert.equal(
    bucket.object(
      `review-hub/v1/cases/${CASE_ID}/${SOURCE_SHA}/reviews/${review.reviewId}/evidence/desktop`,
    ),
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
  const review = await createReview(bucket);
  bucket.failNextPutFor(`review-hub/v1/state/${CASE_ID}.json`);

  const response = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
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


test("superseding review during the final Case promotion makes approval fail closed", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  bucket.beforeNextPutFor(
    `review-hub/v1/state/${CASE_ID}.json`,
    async () => {
      await createReview(bucket, SUPERSEDED_SHA, NOW + 500);
    },
  );

  const response = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, review.reviewId),
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


test("recapture atomically makes the previous Review Superseded and keeps one Current Review", async () => {
  const bucket = new MemoryReviewStorage();
  const first = await createReview(bucket, SOURCE_SHA, NOW);
  const second = await createReview(bucket, SOURCE_SHA, NOW + 500);

  const state = JSON.parse(
    new TextDecoder().decode(bucket.object(`review-hub/v1/state/${CASE_ID}.json`).bytes),
  );
  assert.equal(state.current.reviewId, second.reviewId);
  assert.equal(state.history.length, 1);
  assert.deepEqual(state.history[0], {
    reviewId: first.reviewId,
    status: "superseded",
    transitionedAt: new Date(NOW + 500).toISOString(),
    supersededByReviewId: second.reviewId,
  });

  const rejected = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: first.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(rejected.status, 409);
  assert.deepEqual(await rejected.json(), {
    reviewId: first.reviewId,
    status: "superseded",
  });
});


test("affecting source change makes the Current Review Stale without deleting Baseline history", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const approved = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(approved.status, 201);

  const stale = await markCurrentReviewStale({
    env: { REVIEW_STORAGE: bucket },
    caseId: CASE_ID,
    affectingSourceSha: STALE_SHA,
    now: () => NOW + 1_000,
  });
  assert.deepEqual(stale, {
    reviewId: review.reviewId,
    status: "stale",
  });

  const state = JSON.parse(
    new TextDecoder().decode(bucket.object(`review-hub/v1/state/${CASE_ID}.json`).bytes),
  );
  assert.equal(state.current, null);
  assert.equal(state.sourceSha, STALE_SHA);
  assert.equal(state.history.at(-1).reviewId, review.reviewId);
  assert.equal(state.history.at(-1).status, "stale");

  const baseline = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline?caseId=${CASE_ID}`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(baseline.status, 200);
  const payload = await baseline.json();
  assert.equal(payload.reviewId, review.reviewId);
  assert.equal(payload.valid, false);

  const rejected = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(rejected.status, 409);
  assert.deepEqual(await rejected.json(), {
    reviewId: review.reviewId,
    status: "stale",
  });
});


test("unapproved Review expires distinctly while compact audit state remains", async () => {
  const bucket = new MemoryReviewStorage();
  const review = await createReview(bucket);

  const rejected = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 4 * 24 * 60 * 60 * 1000,
  });
  assert.equal(rejected.status, 410);
  assert.deepEqual(await rejected.json(), {
    reviewId: review.reviewId,
    status: "expired",
  });

  const state = JSON.parse(
    new TextDecoder().decode(bucket.object(`review-hub/v1/state/${CASE_ID}.json`).bytes),
  );
  assert.equal(state.current, null);
  assert.equal(state.history.at(-1).reviewId, review.reviewId);
  assert.equal(state.history.at(-1).status, "expired");
});


test("Baseline changes only after approval and Approval history stays append-only", async () => {
  const bucket = new MemoryReviewStorage();
  const first = await createReview(bucket, SOURCE_SHA, NOW);
  const firstApproval = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: first.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW,
  });
  assert.equal(firstApproval.status, 201);

  const second = await createReview(bucket, SUPERSEDED_SHA, NOW + 500);

  const beforeApproval = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline?caseId=${CASE_ID}`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 600,
  });
  assert.equal(beforeApproval.status, 200);
  const beforePayload = await beforeApproval.json();
  assert.equal(beforePayload.reviewId, first.reviewId);
  assert.equal(beforePayload.valid, false);
  assert.equal(
    bucket.objectsWithPrefix(`review-hub/v1/approvals/${CASE_ID}/`).length,
    1,
  );

  const secondApproval = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: second.reviewId }),
    }),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(secondApproval.status, 201);

  const afterApproval = await handleReviewRequest({
    request: new Request(
      `https://admin.looksawful.ru/lab/review/baseline?caseId=${CASE_ID}`,
    ),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(afterApproval.status, 200);
  const afterPayload = await afterApproval.json();
  assert.equal(afterPayload.reviewId, second.reviewId);
  assert.equal(afterPayload.valid, true);
  assert.equal(
    bucket.objectsWithPrefix(`review-hub/v1/approvals/${CASE_ID}/`).length,
    2,
    "successful Approval records are append-only",
  );
});


test("approval binds to the exact Review ID even when Case SHA and depth are unchanged", async () => {
  const bucket = new MemoryReviewStorage();
  const first = await createReview(bucket, SOURCE_SHA, NOW);
  const second = await createReview(bucket, SOURCE_SHA, NOW + 500);

  assert.match(first.reviewId, /^[0-9a-f-]{36}$/u);
  assert.match(second.reviewId, /^[0-9a-f-]{36}$/u);
  assert.notEqual(first.reviewId, second.reviewId);

  const stale = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, first.reviewId),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(stale.status, 409);

  const approved = await handleReviewRequest({
    request: approvalRequest(SOURCE_SHA, second.reviewId),
    env: { REVIEW_STORAGE: bucket },
    session: OWNER_SESSION,
    now: () => NOW + 1_000,
  });
  assert.equal(approved.status, 201);
  const payload = await approved.json();
  assert.equal(payload.reviewId, second.reviewId);
});
