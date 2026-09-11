import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const transportUrl = new URL(
  "../src/features/portfolio-pet/assistant-transport.ts",
  import.meta.url,
);

async function loadTransport() {
  assert.equal(existsSync(transportUrl), true, "RED: assistant transport is not implemented yet");
  return import(transportUrl.href);
}

function generateRoute(overrides = {}) {
  return {
    kind: "generate",
    message: "Расскажи подробнее про продуктовый подход",
    context: {
      sourceIds: ["profile.about", "project.jestei"],
      page: "/work/jestei/",
      locale: "ru",
    },
    ...overrides,
  };
}

test("assistant transport sends only the narrow public request contract", async () => {
  const { createPortfolioAssistantTransport } = await loadTransport();
  let request = null;

  const transport = createPortfolioAssistantTransport({
    sessionId: "session-test-1",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(
        JSON.stringify({
          kind: "answer",
          text: "Короткий ответ.",
          sources: ["project.jestei"],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const route = generateRoute();
  route.email = "private@example.com";
  route.formMessage = "private draft";
  route.context.formEmail = "private@example.com";

  const result = await transport.generate(route);

  assert.equal(request.url, "https://api.looksawful.ru/v1/portfolio-chat");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(request.init.body), {
    message: "Расскажи подробнее про продуктовый подход",
    locale: "ru",
    sessionId: "session-test-1",
    context: {
      currentPath: "/work/jestei/",
      sourceIds: ["profile.about", "project.jestei"],
    },
  });
  assert.deepEqual(result, {
    kind: "answer",
    text: "Короткий ответ.",
    sources: ["project.jestei"],
  });
});

test("assistant transport maps backend no_data without inventing an answer", async () => {
  const { createPortfolioAssistantTransport } = await loadTransport();
  const transport = createPortfolioAssistantTransport({
    sessionId: "session-test-2",
    fetchImpl: async () => new Response(
      JSON.stringify({ kind: "no_data", text: "", sources: [] }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  });

  assert.deepEqual(await transport.generate(generateRoute()), {
    kind: "no_data",
    text: "",
    sources: [],
  });
});

test("assistant transport maps 429 and invalid server responses to recoverable states", async () => {
  const { createPortfolioAssistantTransport } = await loadTransport();

  const limited = createPortfolioAssistantTransport({
    sessionId: "session-test-3",
    fetchImpl: async () => new Response("", { status: 429 }),
  });
  assert.deepEqual(await limited.generate(generateRoute()), { kind: "rate_limited" });

  const invalid = createPortfolioAssistantTransport({
    sessionId: "session-test-4",
    fetchImpl: async () => new Response("not-json", { status: 200 }),
  });
  assert.deepEqual(await invalid.generate(generateRoute()), { kind: "unavailable" });
});

test("assistant transport aborts a stalled request and returns unavailable", async () => {
  const { createPortfolioAssistantTransport } = await loadTransport();
  let observedSignal = null;

  const transport = createPortfolioAssistantTransport({
    sessionId: "session-test-5",
    timeoutMs: 10,
    fetchImpl: async (_url, init) => {
      observedSignal = init.signal;
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
          once: true,
        });
      });
    },
  });

  assert.deepEqual(await transport.generate(generateRoute()), { kind: "unavailable" });
  assert.equal(observedSignal.aborted, true);
});
