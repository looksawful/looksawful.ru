import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";

const PORT = 18765;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TOKEN = "smoke-test-token";
let child;

async function waitForServer() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/healthz`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("server did not start in time");
}

before(async () => {
  child = spawn(process.execPath, ["src/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    stdio: "ignore",
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      AWFUL_INTERNAL_TOKEN: TOKEN,
      OPENAI_API_KEY: "",
      YANDEX_AI_API_KEY: "",
    },
  });
  await waitForServer();
});

after(() => {
  child?.kill("SIGTERM");
});

test("health endpoint is public", async () => {
  const response = await fetch(`${BASE_URL}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "awful-control-plane",
  });
});

test("ready endpoint reports configured internal auth", async () => {
  const response = await fetch(`${BASE_URL}/readyz`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).authConfigured, true);
});

test("protected endpoint rejects missing bearer token", async () => {
  const response = await fetch(`${BASE_URL}/v1/capabilities`);
  assert.equal(response.status, 401);
});

test("protected endpoint accepts the configured bearer token", async () => {
  const response = await fetch(`${BASE_URL}/v1/capabilities`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "awful-control-plane");
});

test("AI route refuses an unconfigured provider key", async () => {
  const response = await fetch(`${BASE_URL}/v1/ai/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ provider: "openai", model: "test", input: "ping" }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "openai_not_configured" });
});

test("AI route rejects unsupported providers", async () => {
  const response = await fetch(`${BASE_URL}/v1/ai/responses`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ provider: "unknown", model: "test", input: "ping" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "unsupported_provider" });
});
