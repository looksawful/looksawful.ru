import assert from "node:assert/strict";
import test from "node:test";

const generatorUrl = new URL("../tools/build-preview-assistant-worker.mjs", import.meta.url);

test("preview assistant worker proxies grounded public knowledge to Yandex without exposing the key", async () => {
  const { buildPreviewAssistantWorkerSource } = await import(generatorUrl.href);
  const source = await buildPreviewAssistantWorkerSource();
  assert.match(source, /foundationModels\/v1\/completion/);
  assert.match(source, /profile\.skills/);
  assert.doesNotMatch(source, /YANDEX_AI_API_KEY\s*[:=]\s*["'][^"']+["']/);

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const worker = (await import(moduleUrl)).default;
  const originalFetch = globalThis.fetch;
  let providerRequest = null;
  globalThis.fetch = async (url, init) => {
    providerRequest = { url: String(url), init };
    return new Response(JSON.stringify({
      result: {
        alternatives: [{ message: { text: "Я работаю с Figma, TypeScript, Blender и AI-пайплайнами." } }],
      },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    const request = new Request("https://preview.example/api/portfolio-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Какими инструментами ты работаешь?",
        locale: "ru",
        sessionId: "preview-test",
        context: { sourceIds: ["profile.skills"] },
      }),
    });
    const response = await worker.fetch(request, {
      YANDEX_AI_API_KEY: "test-secret",
      YANDEX_AI_MODEL_URI: "gpt://folder/yandexgpt-5-lite/latest",
      PORTFOLIO_ASSISTANT_ENABLED: "true",
      ASSETS: { fetch: async () => new Response("asset") },
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.kind, "answer");
    assert.match(payload.text, /Я работаю/);
    assert.deepEqual(payload.sources, ["profile.skills"]);
    assert.match(providerRequest.url, /foundationModels\/v1\/completion$/);
    assert.equal(providerRequest.init.headers.Authorization, "Api-Key test-secret");
    assert.match(providerRequest.init.body, /profile\.skills/);
    assert.match(providerRequest.init.body, /Ты Venus/);
    assert.match(providerRequest.init.body, /от первого лица/);
    assert.match(providerRequest.init.body, /1.?2 коротких абзац/);
    assert.match(providerRequest.init.body, /не придумывай/i);
    assert.doesNotMatch(providerRequest.init.body, /Ты Awful/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
