import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const providerUrl = new URL("../server/public-assistant/yandex-provider.ts", import.meta.url);

async function loadProvider() {
  assert.equal(existsSync(providerUrl), true, "RED: Yandex provider adapter is not implemented yet");
  return import(providerUrl.href);
}

const modelUri = "gpt://b1gccfh8f63ut5b9eogf/yandexgpt-5-lite/latest";
const sources = [
  {
    id: "project.jestei",
    title: "Jestei Pool",
    text: "Approved Jestei context only.",
  },
];

function input() {
  return {
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sources,
  };
}

test("Yandex provider sends one bounded non-streaming chat completion request", async () => {
  const { createYandexPortfolioProvider } = await loadProvider();
  let request = null;

  const provider = createYandexPortfolioProvider({
    modelUri,
    authorizationHeader: "Api-Key secret-test-value",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "  Короткий ответ.  " } }],
          usage: { prompt_tokens: 80, completion_tokens: 12, total_tokens: 92 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await provider(input());

  assert.equal(request.url, "https://ai.api.cloud.yandex.net/v1/chat/completions");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.authorization, "Api-Key secret-test-value");
  assert.equal(request.init.headers["content-type"], "application/json");
  assert.equal(request.init.signal instanceof AbortSignal, true);

  const body = JSON.parse(request.init.body);
  assert.equal(body.model, modelUri);
  assert.equal(body.temperature, 0.2);
  assert.equal(body.max_tokens, 256);
  assert.equal(body.stream, false);
  assert.equal(body.messages.length, 2);
  assert.equal(body.messages[0].role, "system");
  assert.match(body.messages[0].content, /project\.jestei/);
  assert.match(body.messages[0].content, /Approved Jestei context only\./);
  assert.equal(body.messages[1].role, "user");
  assert.equal(body.messages[1].content, "Как устроен нестандартный сценарий?");
  assert.deepEqual(result, { kind: "answer", text: "Короткий ответ." });
});

test("Yandex provider aborts a stuck upstream within the hard provider deadline", async () => {
  const { createYandexPortfolioProvider } = await loadProvider();
  let fetchCalls = 0;

  const provider = createYandexPortfolioProvider({
    modelUri,
    authorizationHeader: "Api-Key secret-test-value",
    timeoutMs: 5,
    fetchImpl: async (_url, init) => {
      fetchCalls += 1;
      return await new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    },
  });

  assert.deepEqual(await provider(input()), { kind: "unavailable" });
  assert.equal(fetchCalls, 1);
});

test("Yandex provider maps 429 without retrying automatically", async () => {
  const { createYandexPortfolioProvider } = await loadProvider();
  let fetchCalls = 0;

  const provider = createYandexPortfolioProvider({
    modelUri,
    authorizationHeader: "Bearer iam-test-token",
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("", { status: 429 });
    },
  });

  assert.deepEqual(await provider(input()), { kind: "rate_limited" });
  assert.equal(fetchCalls, 1);
});

test("Yandex provider maps server failures, malformed payloads and blank answers to unavailable", async () => {
  const { createYandexPortfolioProvider } = await loadProvider();

  for (const responseFactory of [
    () => new Response("provider down", { status: 503 }),
    () => new Response("not-json", { status: 200 }),
    () => new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    () => new Response(
      JSON.stringify({ choices: [{ message: { role: "assistant", content: "   " } }] }),
      { status: 200 },
    ),
  ]) {
    const provider = createYandexPortfolioProvider({
      modelUri,
      authorizationHeader: "Api-Key secret-test-value",
      fetchImpl: async () => responseFactory(),
    });

    assert.deepEqual(await provider(input()), { kind: "unavailable" });
  }
});

test("Yandex provider does not accept missing server-side credentials or model configuration", async () => {
  const { createYandexPortfolioProvider } = await loadProvider();

  assert.throws(
    () => createYandexPortfolioProvider({
      modelUri: "",
      authorizationHeader: "Api-Key secret-test-value",
      fetchImpl: async () => new Response(""),
    }),
    /model/i,
  );

  assert.throws(
    () => createYandexPortfolioProvider({
      modelUri,
      authorizationHeader: "",
      fetchImpl: async () => new Response(""),
    }),
    /authorization/i,
  );
});
