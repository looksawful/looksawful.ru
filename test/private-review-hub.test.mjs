import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { handleReviewRequest } from "../lab/functions/review.js";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";
const REVIEW_TARGET_ID = "project:awful-mockups";

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

  async delete(keys) {
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      this.#objects.delete(key);
    }
  }

  keysWithPrefix(prefix) {
    return [...this.#objects.keys()].filter((key) => key.startsWith(prefix));
  }
}

function manifest() {
  return {
    version: 1,
    reviewTargetId: REVIEW_TARGET_ID,
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

function uploadRequest(file = new File(["private-image"], "desktop.png", { type: "image/png" })) {
  const form = new FormData();
  form.set("manifest", JSON.stringify(manifest()));
  form.set("desktop", file);
  return new Request("https://admin.looksawful.ru/lab/review/api", {
    method: "POST",
    body: form,
  });
}

test("private review stores one Review Target evidence and returns only sanitized manifest data", async () => {
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
  assert.equal(payload.reviewTargetId, REVIEW_TARGET_ID);
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
  assert.equal(JSON.stringify(payload).includes("assetId"), false);
  assert.equal(JSON.stringify(payload).includes("cloudinary"), false);
});

test("private review rejects a Review Target that is not the canonical thin-slice SitePage", async () => {
  const bucket = new MemoryReviewStorage();
  const invalidManifest = {
    ...manifest(),
    reviewTargetId: "project:not-a-site-page",
  };
  const form = new FormData();
  form.set("manifest", JSON.stringify(invalidManifest));
  form.set("desktop", new File(["private-image"], "desktop.png", { type: "image/png" }));

  const response = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api", {
      method: "POST",
      body: form,
    }),
    env: { REVIEW_STORAGE: bucket },
  });

  assert.equal(response.status, 400);
  assert.equal(bucket.keysWithPrefix("review-hub/v1/targets/").length, 0);
});

test("private review thin slice rejects a different canonical SitePage target", async () => {
  const bucket = new MemoryReviewStorage();
  const otherManifest = {
    ...manifest(),
    reviewTargetId: "home",
  };
  const form = new FormData();
  form.set("manifest", JSON.stringify(otherManifest));
  form.set("desktop", new File(["private-image"], "desktop.png", { type: "image/png" }));

  const response = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api", {
      method: "POST",
      body: form,
    }),
    env: { REVIEW_STORAGE: bucket },
  });

  assert.equal(response.status, 400);
  assert.equal(bucket.keysWithPrefix("review-hub/v1/targets/").length, 0);
});

test("private review evidence is served through the private application path and fails closed without backend configuration", async () => {
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
  assert.equal(evidence.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(await evidence.text(), "private-image");

  const unavailable = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: {},
  });
  assert.equal(unavailable.status, 503);
});

test("Review Hub is inside the authenticated Lab boundary and renders Review Target fields", async () => {
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
  assert.match(html, /id="review-target"/);
  assert.match(html, /id="review-sha"/);
  assert.match(html, /id="review-depth"/);
  assert.match(html, /id="review-evidence"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="review-reload"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(client, /reviewTargetId/);
  assert.match(client, /\/lab\/review\/api/);
  assert.match(client, /Number\.isFinite\(Date\.parse/);
  assert.match(client, /Evidence image unavailable/);
  assert.match(client, /window\.location\.reload/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(client, /localStorage|sessionStorage/);
});

test("recapturing the same Review Target SHA creates a distinct immutable Review", async () => {
  const bucket = new MemoryReviewStorage();

  const firstResponse = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(firstResponse.status, 201);
  const first = await firstResponse.json();

  const secondResponse = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
  });
  assert.equal(secondResponse.status, 201);
  const second = await secondResponse.json();

  assert.match(first.reviewId, /^[0-9a-f-]{36}$/u);
  assert.match(second.reviewId, /^[0-9a-f-]{36}$/u);
  assert.notEqual(second.reviewId, first.reviewId);

  const reviewObjects = bucket.keysWithPrefix(
    `review-hub/v1/targets/${encodeURIComponent(REVIEW_TARGET_ID)}/${SOURCE_SHA}/reviews/`,
  );
  assert.equal(
    reviewObjects.filter((key) => key.endsWith("/manifest.json")).length,
    2,
    "each capture keeps its own immutable manifest",
  );
  assert.equal(
    reviewObjects.filter((key) => key.endsWith("/evidence/desktop")).length,
    2,
    "each capture keeps its own immutable evidence",
  );
});

test("expired Review cleanup cannot remove a newer Current Review", async () => {
  const bucket = new MemoryReviewStorage();
  const firstResponse = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
    now: () => 0,
  });
  assert.equal(firstResponse.status, 201);
  const first = await firstResponse.json();

  let signalStaleManifestRead;
  let resumeStaleManifestRead;
  const staleManifestRead = new Promise((resolve) => {
    signalStaleManifestRead = resolve;
  });
  const staleManifestResume = new Promise((resolve) => {
    resumeStaleManifestRead = resolve;
  });

  const racingStorage = {
    put: (...args) => bucket.put(...args),
    delete: (...args) => bucket.delete(...args),
    get: async (key) => {
      const object = await bucket.get(key);
      if (key.endsWith(`/reviews/${first.reviewId}/manifest.json`)) {
        signalStaleManifestRead();
        await staleManifestResume;
      }
      return object;
    },
  };

  const staleRead = handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: racingStorage },
    now: () => 5 * 24 * 60 * 60 * 1000,
  });

  await staleManifestRead;

  const secondResponse = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_STORAGE: bucket },
    now: () => 5 * 24 * 60 * 60 * 1000,
  });
  assert.equal(secondResponse.status, 201);
  const second = await secondResponse.json();

  resumeStaleManifestRead();
  const staleResponse = await staleRead;
  assert.equal(staleResponse.status, 404);

  const currentResponse = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_STORAGE: bucket },
    now: () => 5 * 24 * 60 * 60 * 1000,
  });
  assert.equal(currentResponse.status, 200);
  const current = await currentResponse.json();
  assert.equal(current.reviewId, second.reviewId);
});

test("review image evidence fails closed above 10 MB", async () => {
  const bucket = new MemoryReviewStorage();
  const tooLarge = new File(
    [new Uint8Array(10 * 1024 * 1024 + 1)],
    "desktop.png",
    { type: "image/png" },
  );

  const response = await handleReviewRequest({
    request: uploadRequest(tooLarge),
    env: { REVIEW_STORAGE: bucket },
  });

  assert.equal(response.status, 400);
  assert.equal(bucket.keysWithPrefix("review-hub/v1/targets/").length, 0);
});
