import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { handleReviewRequest } from "../lab/functions/review.js";

const SOURCE_SHA = "0123456789abcdef0123456789abcdef01234567";

class MemoryR2 {
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
  const bucket = new MemoryR2();

  const created = await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_EVIDENCE: bucket },
  });
  assert.equal(created.status, 201);

  const response = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/api"),
    env: { REVIEW_EVIDENCE: bucket },
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

test("private review evidence is served from R2 and storage fails closed without its binding", async () => {
  const bucket = new MemoryR2();
  await handleReviewRequest({
    request: uploadRequest(),
    env: { REVIEW_EVIDENCE: bucket },
  });

  const evidence = await handleReviewRequest({
    request: new Request("https://admin.looksawful.ru/lab/review/evidence/desktop"),
    env: { REVIEW_EVIDENCE: bucket },
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
  const [middleware, config, html, client] = await Promise.all([
    readFile(new URL("../lab/functions/_middleware.js", import.meta.url), "utf8"),
    readFile(new URL("../vite.lab.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../lab/review/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/review.ts", import.meta.url), "utf8"),
  ]);

  assert.match(middleware, /review\.js/);
  assert.match(middleware, /verifyAdminSession/);
  assert.match(config, /lab\/review\/index\.html/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /id="review-case"/);
  assert.match(html, /id="review-sha"/);
  assert.match(html, /id="review-depth"/);
  assert.match(html, /id="review-evidence"/);
  assert.match(client, /\/lab\/review\/api/);
  assert.doesNotMatch(client, /localStorage|sessionStorage/);
});
