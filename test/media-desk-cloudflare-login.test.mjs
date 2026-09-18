import assert from "node:assert/strict";
import test from "node:test";

import worker from "../tools/cloudflare/media-desk/worker.mjs";
import { createPasswordHash } from "../tools/cloudflare/media-desk/auth.mjs";

async function testEnv() {
  return {
    MEDIA_DESK_PASSWORD_HASH: await createPasswordHash("secret", new Uint8Array(16).fill(7), 210_000),
    MEDIA_DESK_SESSION_SECRET: "test-session-secret-32-bytes-minimum",
    ASSETS: { fetch: async () => new Response("desk") },
  };
}

test("unauthenticated browser receives a usable password login form", async () => {
  const response = await worker.fetch(
    new Request("https://media.looksawful.ru/tools/media-desk/", { headers: { accept: "text/html" } }),
    await testEnv(),
  );
  assert.equal(response.status, 401);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  const body = await response.text();
  assert.match(body, /<form[^>]+method="post"[^>]+action="\/login"/i);
  assert.match(body, /<input[^>]+type="password"[^>]+name="password"/i);
});

test("browser form login redirects to the Desk with a strict session cookie", async () => {
  const response = await worker.fetch(
    new Request("https://media.looksawful.ru/login", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://media.looksawful.ru",
      },
      body: new URLSearchParams({ password: "secret" }),
    }),
    await testEnv(),
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/tools/media-desk/");
  assert.match(response.headers.get("set-cookie") ?? "", /__Host-media_desk_session=/);
});

test("login page and form errors remain valid UTF-8 Russian copy", async () => {
  const env = await testEnv();
  const page = await worker.fetch(new Request(
    "https://media.looksawful.ru/tools/media-desk/",
    { headers: { accept: "text/html" } },
  ), env);
  const body = await page.text();
  assert.match(body, /Закрытая рабочая область looksawful\./);
  assert.match(body, />Пароль<input/);
  assert.match(body, />Войти<\/button>/);

  const wrong = await worker.fetch(new Request("https://media.looksawful.ru/login", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://media.looksawful.ru",
    },
    body: new URLSearchParams({ password: "wrong" }),
  }), env);
  assert.match(await wrong.text(), /Неверный пароль\./);
});
