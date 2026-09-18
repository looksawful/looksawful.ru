import assert from "node:assert/strict";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

const ORIGIN = "https://media.looksawful.ru";
const PUBLIC_ORIGIN = "https://looksawful.ru";

async function login(env) {
  const response = await worker.fetch(new Request(`${ORIGIN}/login`, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ password: "secret" }),
  }), env);
  assert.equal(response.status, 204);
  return (response.headers.get("set-cookie") ?? "").split(";", 1)[0];
}
async function makeEnv(publicFetch, assetFetch = async () => new Response("asset")) {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash(
      "secret",
      new Uint8Array(16).fill(9),
      210_000,
    ),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    MEDIA_DESK_GITHUB_TOKEN: "test-token",
    MEDIA_DESK_PUBLIC_FETCH: publicFetch,
    ASSETS: { fetch: assetFetch },
  };
}

test("public preview paths remain authenticated", async () => {
  let publicCalls = 0;
  const env = await makeEnv(async () => {
    publicCalls += 1;
    return new Response("unexpected");
  });
  const response = await worker.fetch(new Request(`${ORIGIN}/media/example.webp`), env);
  assert.equal(response.status, 401);
  assert.equal(publicCalls, 0);
});
test("authenticated media preview proxies to the fixed public site without session leakage", async () => {
  const calls = [];
  const env = await makeEnv(async (request) => {
    calls.push(request);
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 206,
      headers: {
        "content-type": "video/mp4",
        "content-range": "bytes 0-2/99",
        "accept-ranges": "bytes",
      },
    });
  });
  const cookie = await login(env);
  const response = await worker.fetch(new Request(
    `${ORIGIN}/media/example.mp4?v=2`,
    { headers: { cookie, range: "bytes=0-2", accept: "video/*" } },
  ), env);

  assert.equal(response.status, 206);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${PUBLIC_ORIGIN}/media/example.mp4?v=2`);
  assert.equal(calls[0].headers.get("range"), "bytes=0-2");
  assert.equal(calls[0].headers.get("cookie"), null);
  assert.equal(response.headers.get("content-range"), "bytes 0-2/99");
  assert.match(response.headers.get("cache-control") ?? "", /private.*no-store/i);
});

test("pets previews proxy, while ordinary desk assets stay on Static Assets", async () => {
  const publicUrls = [];
  let assetCalls = 0;
  const env = await makeEnv(
    async (request) => {
      publicUrls.push(request.url);
      return new Response("pet", { headers: { "content-type": "image/png" } });
    },
    async () => {
      assetCalls += 1;
      return new Response("desk-asset", { headers: { "content-type": "text/css" } });
    },
  );
  const cookie = await login(env);

  const pet = await worker.fetch(new Request(
    `${ORIGIN}/pets/awful-cases/assets/ground.png`,
    { headers: { cookie } },
  ), env);
  assert.equal(pet.status, 200);
  assert.deepEqual(publicUrls, [`${PUBLIC_ORIGIN}/pets/awful-cases/assets/ground.png`]);

  const asset = await worker.fetch(new Request(
    `${ORIGIN}/assets/app.css`,
    { headers: { cookie } },
  ), env);
  assert.equal(asset.status, 200);
  assert.equal(assetCalls, 1);
  assert.equal(await asset.text(), "desk-asset");
});
