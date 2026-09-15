import assert from "node:assert/strict";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

function cookieValue(setCookie) {
  return setCookie.split(";", 1)[0];
}

async function env() {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(4), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    MEDIA_DESK_GITHUB_FETCH: async (url) => {
      const target = String(url);
      if (/\/git\/ref\/heads\/content\/text-cms$/.test(target)) {
        return Response.json({ object: { sha: "head-status-a" } });
      }
      if (target.includes("/contents/src/content/projects.json?ref=content%2Ftext-cms")) {
        return Response.json({
          sha: "blob-projects-a",
          encoding: "base64",
          content: Buffer.from("[]\n", "utf8").toString("base64"),
        });
      }
      throw new Error(`Unexpected GitHub request: ${target}`);
    },
    ASSETS: { fetch: async () => new Response("asset") },
  };
}

async function login(runtime) {
  const response = await worker.fetch(new Request("https://media.looksawful.ru/login", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://media.looksawful.ru" },
    body: JSON.stringify({ password: "secret" }),
  }), runtime);
  assert.equal(response.status, 204);
  return cookieValue(response.headers.get("set-cookie") ?? "");
}

test("remote status is authenticated and reports exact authoring head", async () => {
  const runtime = await env();
  const anonymous = await worker.fetch(new Request("https://media.looksawful.ru/api/status"), runtime);
  assert.equal(anonymous.status, 401);

  const cookie = await login(runtime);
  const response = await worker.fetch(new Request("https://media.looksawful.ru/api/status", {
    headers: { cookie, accept: "application/json" },
  }), runtime);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
  assert.deepEqual(JSON.parse(await response.text()), {
    ok: true,
    branch: "content/text-cms",
    head: "head-status-a",
  });
});



test("remote revision endpoint returns guarded source revision without source text", async () => {
  const runtime = await env();
  const cookie = await login(runtime);
  const response = await worker.fetch(new Request(
    "https://media.looksawful.ru/api/media/revision?target=project-cover",
    { headers: { cookie, accept: "application/json" } },
  ), runtime);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
  const payload = JSON.parse(await response.text());
  assert.equal(payload.ok, true);
  assert.equal(payload.path, "src/content/projects.json");
  assert.equal(payload.head, "head-status-a");
  assert.match(payload.revision, /^[a-f0-9]{64}$/);
  assert.equal("text" in payload, false);
});

test("revision API rejects raw repository paths and accepts fixed revision targets", async () => {
  const runtime = await env();
  const cookie = await login(runtime);
  const raw = await worker.fetch(new Request(
    "https://media.looksawful.ru/api/media/revision?path=src%2Fcontent%2Fprojects.json",
    { headers: { cookie, accept: "application/json" } },
  ), runtime);
  assert.equal(raw.status, 400);

  const fixed = await worker.fetch(new Request(
    "https://media.looksawful.ru/api/media/revision?target=project-cover",
    { headers: { cookie, accept: "application/json" } },
  ), runtime);
  assert.equal(fixed.status, 200);
  const payload = await fixed.json();
  assert.equal(payload.path, "src/content/projects.json");
  assert.equal(payload.head, "head-status-a");
});
