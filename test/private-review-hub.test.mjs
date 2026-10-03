import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { handleReviewRequest } from "../lab/functions/review.js";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
const REVIEW_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SECOND_REVIEW_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

class MemoryReviewStorage {
  #objects = new Map();
  #version = 0;

  async put(key, value, options = {}) {
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
    const object = {
      bytes,
      etag: `etag-${++this.#version}`,
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
      body: object.bytes,
      etag: object.etag,
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata,
      text: async () => new TextDecoder().decode(object.bytes),
    };
  }

  object(key) {
    return this.#objects.get(key) ?? null;
  }

  objectsWithPrefix(prefix) {
    return [...this.#objects.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, object]) => ({ key, ...object }));
  }
}

function manifest(reviewId = REVIEW_ID) {
  return {
    version: 1,
    reviewId,
    caseId: "awful-mockups",
    sourceSha: SOURCE_SHA,
    reviewDepth: "quick",
    capturedAt: "2026-09-21T14:00:00.000Z",
    evidence: [
      {
        id: "desktop",
        kind: "viewport",
        contentType: "image/png",
      },
    ],
  };
}

function uploadRequest(reviewId = REVIEW_ID, image = "private-image") {
  const form = new FormData();
  form.set("manifest", JSON.stringify(manifest(reviewId)));
  form.set("desktop", new File([image], "desktop.png", { type: "image/png" }));
  return new Request("https://admin.looksawful.ru/lab/review/api", {
    method: "POST",
    body: form,
  });
}

test("private review stores one Case evidence and returns only sanitized manifest data", async () => {
  const bucket = new MemoryReviewStorage();

  const created = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(created.status, 201);

  const response = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");

  const payload = await response.json();
  assert.equal(payload.reviewId, REVIEW_ID);
  assert.equal(payload.caseId, "awful-mockups");
  assert.equal(payload.sourceSha, SOURCE_SHA);
  assert.equal(payload.reviewDepth, "quick");
  assert.deepEqual(payload.evidence, [
    {
      id: "desktop",
      kind: "viewport",
      contentType: "image/png",
      url: "/lab/review/evidence/desktop",
    },
  ]);
  assert.equal(JSON.stringify(payload).includes("reviews/"), false);
  assert.equal(JSON.stringify(payload).includes("objectKey"), false);
});


test("recapturing the same Case and SHA creates a new immutable Review", async () => {
  const bucket = new MemoryReviewStorage();

  const first = await handleReviewRequest({
    request: uploadRequest(REVIEW_ID, "first-private-image"),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(first.status, 201);

  const second = await handleReviewRequest({
    request: uploadRequest(SECOND_REVIEW_ID, "second-private-image"),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(second.status, 201);

  const current = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(current.status, 200);
  assert.equal((await current.json()).reviewId, SECOND_REVIEW_ID);

  const firstManifestKey =
    `review-hub/v1/cases/awful-mockups/reviews/${REVIEW_ID}/manifest.json`;
  const secondManifestKey =
    `review-hub/v1/cases/awful-mockups/reviews/${SECOND_REVIEW_ID}/manifest.json`;
  const firstEvidenceKey =
    `review-hub/v1/cases/awful-mockups/reviews/${REVIEW_ID}/evidence/desktop`;
  const secondEvidenceKey =
    `review-hub/v1/cases/awful-mockups/reviews/${SECOND_REVIEW_ID}/evidence/desktop`;

  assert.ok(bucket.object(firstManifestKey), "first Review manifest must remain immutable");
  assert.ok(bucket.object(secondManifestKey), "second Review manifest must be stored separately");
  assert.equal(
    new TextDecoder().decode(bucket.object(firstEvidenceKey)?.bytes),
    "first-private-image",
  );
  assert.equal(
    new TextDecoder().decode(bucket.object(secondEvidenceKey)?.bytes),
    "second-private-image",
  );
  assert.equal(
    bucket.objectsWithPrefix("review-hub/v1/cases/awful-mockups/reviews/").length,
    4,
    "two immutable Review packages must coexist",
  );
});

test("private review evidence is served from private storage and fails closed without backend configuration", async () => {
  const bucket = new MemoryReviewStorage();
  await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
  });

  const evidence = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/evidence/desktop"),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(evidence.status, 200);
  assert.equal(evidence.headers.get("Content-Type"), "image/png");
  assert.equal(evidence.headers.get("Cache-Control"), "private, no-store");
  assert.equal(await evidence.text(), "private-image");

  const unavailable = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: {},
  });
  assert.equal(unavailable.status, 503);
});

test("Review Hub is inside the authenticated Lab boundary and renders Case review fields", async () => {
  const [middleware, config, html, client, styles] = await Promise.all([
    readFile(new URL("../lab/functions/_middleware.js", import.meta.url), "utf8"),
    readFile(new URL("../vite.lab.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../lab/review/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/review.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/lab.css", import.meta.url), "utf8"),
  ]);

  assert.match(middleware, /review\.js/);
  assert.match(middleware, /verifyAdminSession/);

  const { onRequest } = await import("../lab/functions/_middleware.js");
  let nextCalled = false;
  const unauthorized = await onRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/evidence/desktop"),
    env: {
      ADMIN_GITHUB_CLIENT_ID: "test-client-id",
      ADMIN_GITHUB_CLIENT_SECRET: "test-client-secret",
      ADMIN_SESSION_SECRET: "test-session-secret-that-is-long-enough",
    },
    next: async () => {
      nextCalled = true;
      return new Response("leaked");
    },
  });
  assert.equal(unauthorized.status, 302);
  assert.equal(nextCalled, false);

  assert.match(config, /lab\/review\/index\.html/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /id="review-case"/);
  assert.match(html, /id="review-sha"/);
  assert.match(html, /id="review-depth"/);
  assert.match(html, /id="review-evidence"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="review-reload"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(client, /\/lab\/review\/api/);
  assert.match(client, /Number\.isFinite\(Date\.parse/);
  assert.match(client, /Evidence image unavailable/);
  assert.match(client, /window\.location\.reload/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(client, /localStorage|sessionStorage/);
});
