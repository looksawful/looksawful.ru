import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { handleReviewRequest } from "../lab/functions/review.js";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";

class MemoryReviewStorage {
  #objects = new Map();

  async put(key, value, options = {}) {
    const bytes =
      typeof value === "string"
        ? new TextEncoder().encode(value)
        : value instanceof ArrayBuffer
          ? new Uint8Array(value)
          : value instanceof Uint8Array
            ? value
            : new Uint8Array(await new Response(value).arrayBuffer());
    this.#objects.set(key, {
      bytes,
      httpMetadata: options.httpMetadata ?? {},
    });
  }

  async get(key) {
    const object = this.#objects.get(key);
    if (!object) return null;
    return {
      body: object.bytes,
      httpMetadata: object.httpMetadata,
      text: async () => new TextDecoder().decode(object.bytes),
    };
  }

  keysWithPrefix(prefix) {
    return [...this.#objects.keys()].filter((key) => key.startsWith(prefix));
  }
}

function manifest() {
  return {
    version: 1,
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

function uploadRequest() {
  const form = new FormData();
  form.set("manifest", JSON.stringify(manifest()));
  form.set("desktop", new File(["private-image"], "desktop.png", { type: "image/png" }));
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


test("recapturing the same Case SHA creates a distinct immutable Review", async () => {
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
    `review-hub/v1/cases/awful-mockups/${SOURCE_SHA}/reviews/`,
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
