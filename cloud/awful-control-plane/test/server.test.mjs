import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";

const PORT = 18765;
const BASE_URL = `http://127.0.0.1:${PORT}`;
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
      AWFUL_INTERNAL_TOKEN: "",
      YANDEX_AI_API_KEY: "",
    },
  });
  await waitForServer();
});

after(() => {
  child?.kill("SIGTERM");
});

test("health endpoint is available to an already-authorized container caller", async () => {
  const response = await fetch(`${BASE_URL}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "awful-control-plane",
  });
});

test("ready endpoint does not depend on an application bearer secret", async () => {
  const response = await fetch(`${BASE_URL}/readyz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ready",
    service: "awful-control-plane",
  });
});

test("capabilities rely on Yandex container IAM rather than an application bearer token", async () => {
  const response = await fetch(`${BASE_URL}/v1/capabilities`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.service, "awful-control-plane");
  assert.equal(body.serverAiProvider.yandex, false);
  assert.equal(body.clients.chatgpt, "planned_via_mcp_app");
  assert.equal(body.clients.codex, "planned_via_mcp");
});

test("AI route refuses an unconfigured Yandex key after platform authorization", async () => {
  const response = await fetch(`${BASE_URL}/v1/ai/responses`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: "test", input: "ping" }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "yandex_not_configured" });
});
