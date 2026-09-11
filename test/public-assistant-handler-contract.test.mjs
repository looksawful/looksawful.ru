import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const handlerUrl = new URL("../server/public-assistant/handler.ts", import.meta.url);

async function loadHandler() {
  assert.equal(existsSync(handlerUrl), true, "RED: public assistant handler is not implemented yet");
  return import(handlerUrl.href);
}

function event(body, overrides = {}) {
  return {
    httpMethod: "POST",
    headers: {
      origin: "https://looksawful.ru",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    ...overrides,
  };
}

function parse(response) {
  return response.body ? JSON.parse(response.body) : null;
}

const sources = Object.freeze({
  "project.jestei": Object.freeze({
    id: "project.jestei",
    title: "Jestei Pool",
    text: "Approved Jestei context.",
  }),
});

test("kill switch disables generation before any provider call", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const handler = createPublicAssistantHandler({
    enabled: false,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  });

  const response = await handler(event({
    message: "Расскажи подробнее",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  }));

  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
  assert.equal(providerCalls, 0);
});

test("CORS preflight is handled without invoking the provider", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const handler = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  });

  const response = await handler(event({}, { httpMethod: "OPTIONS", body: "" }));
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "https://looksawful.ru");
  assert.equal(providerCalls, 0);
});

test("invalid requests fail before generation", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const handler = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  });

  const wrongMethod = await handler(event({}, { httpMethod: "GET" }));
  assert.equal(wrongMethod.statusCode, 405);

  const tooLong = await handler(event({
    message: "x".repeat(2001),
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  }));
  assert.equal(tooLong.statusCode, 400);
  assert.equal(providerCalls, 0);
});

test("unknown source ids return no_data without a paid provider call", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const handler = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  });

  const response = await handler(event({
    message: "Расскажи подробнее",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["unknown.source"] },
  }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(parse(response), { kind: "no_data", text: "", sources: [] });
  assert.equal(providerCalls, 0);
});

test("valid request calls provider once with server-approved context only", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  let providerInput = null;
  const handler = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async (input) => {
      providerCalls += 1;
      providerInput = input;
      return { kind: "answer", text: "  Короткий ответ.  " };
    },
  });

  const response = await handler(event({
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sessionId: "session-1",
    email: "must-not-leak@example.com",
    formMessage: "must not leak",
    context: {
      currentPath: "/work/jestei/",
      sourceIds: ["project.jestei", "unknown.source"],
      formEmail: "must-not-leak@example.com",
    },
  }));

  assert.equal(providerCalls, 1);
  assert.deepEqual(providerInput, {
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sources: [{ id: "project.jestei", title: "Jestei Pool", text: "Approved Jestei context." }],
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(parse(response), {
    kind: "answer",
    text: "Короткий ответ.",
    sources: ["project.jestei"],
  });
});

test("provider rate limit and failure become recoverable public states", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  const request = event({
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/work/jestei/", sourceIds: ["project.jestei"] },
  });

  const limited = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => ({ kind: "rate_limited" }),
  });
  assert.equal((await limited(request)).statusCode, 429);

  const unavailable = createPublicAssistantHandler({
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    provider: async () => {
      throw new Error("provider offline");
    },
  });
  const response = await unavailable(request);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
});
