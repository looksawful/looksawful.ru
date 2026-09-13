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

const allowAdmission = async () => ({ kind: "allow" });

const sources = Object.freeze({
  "project.jestei": Object.freeze({
    id: "project.jestei",
    title: "Jestei Pool",
    text: "Approved Jestei context.",
  }),
});

function handlerOptions(overrides = {}) {
  return {
    enabled: true,
    allowedOrigins: ["https://looksawful.ru"],
    sources,
    admitRequest: allowAdmission,
    provider: async () => ({ kind: "answer", text: "Короткий ответ." }),
    ...overrides,
  };
}

test("kill switch disables generation before admission or provider calls", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let admissionCalls = 0;
  let providerCalls = 0;
  const handler = createPublicAssistantHandler(handlerOptions({
    enabled: false,
    admitRequest: async () => {
      admissionCalls += 1;
      return { kind: "allow" };
    },
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));

  const response = await handler(event({
    message: "Расскажи подробнее",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  }));

  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
  assert.equal(admissionCalls, 0);
  assert.equal(providerCalls, 0);
});

test("CORS preflight is handled without admission or provider calls", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let admissionCalls = 0;
  let providerCalls = 0;
  const handler = createPublicAssistantHandler(handlerOptions({
    admitRequest: async () => {
      admissionCalls += 1;
      return { kind: "allow" };
    },
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));

  const response = await handler(event({}, { httpMethod: "OPTIONS", body: "" }));
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "https://looksawful.ru");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(admissionCalls, 0);
  assert.equal(providerCalls, 0);
});

test("invalid method, media type and bodies fail before admission or generation", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let admissionCalls = 0;
  let providerCalls = 0;
  const handler = createPublicAssistantHandler(handlerOptions({
    admitRequest: async () => {
      admissionCalls += 1;
      return { kind: "allow" };
    },
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));

  const wrongMethod = await handler(event({}, { httpMethod: "GET" }));
  assert.equal(wrongMethod.statusCode, 405);

  const wrongContentType = await handler(event({
    message: "ok",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  }, {
    headers: { origin: "https://looksawful.ru", "content-type": "text/plain" },
  }));
  assert.equal(wrongContentType.statusCode, 415);

  const tooLong = await handler(event({
    message: "x".repeat(2001),
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  }));
  assert.equal(tooLong.statusCode, 400);

  const oversizedAsciiBody = await handler(event({
    message: "ok",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
    ignoredPadding: "x".repeat(9_000),
  }));
  assert.equal(oversizedAsciiBody.statusCode, 400);

  const oversizedUtf8Body = await handler(event({
    message: "ok",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
    ignoredPadding: "я".repeat(4_500),
  }));
  assert.equal(oversizedUtf8Body.statusCode, 400);
  assert.equal(admissionCalls, 0);
  assert.equal(providerCalls, 0);
});

test("request admission is fail-closed and runs before any paid provider call", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  const request = event({
    message: "Расскажи подробнее",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.jestei"] },
  });

  for (const [kind, statusCode] of [["rate_limited", 429], ["unavailable", 503]]) {
    let providerCalls = 0;
    const handler = createPublicAssistantHandler(handlerOptions({
      admitRequest: async (input) => {
        assert.deepEqual(input, { origin: "https://looksawful.ru", sessionId: "session-1" });
        return { kind };
      },
      provider: async () => {
        providerCalls += 1;
        return { kind: "answer", text: "must not run" };
      },
    }));
    assert.equal((await handler(request)).statusCode, statusCode);
    assert.equal(providerCalls, 0);
  }

  let providerCalls = 0;
  const throwing = createPublicAssistantHandler(handlerOptions({
    admitRequest: async () => {
      throw new Error("admission unavailable");
    },
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));
  assert.equal((await throwing(request)).statusCode, 503);
  assert.equal(providerCalls, 0);
});

test("unknown source ids return no_data without a paid provider call", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const handler = createPublicAssistantHandler(handlerOptions({
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));

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

test("oversized approved source context fails closed before a paid provider call", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  const oversizedSources = {
    "project.large": {
      id: "project.large",
      title: "Large approved source",
      text: "x".repeat(4_001),
    },
  };
  const handler = createPublicAssistantHandler(handlerOptions({
    sources: oversizedSources,
    provider: async () => {
      providerCalls += 1;
      return { kind: "answer", text: "must not run" };
    },
  }));

  const response = await handler(event({
    message: "Расскажи подробнее",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/", sourceIds: ["project.large"] },
  }));

  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
  assert.equal(providerCalls, 0);
});

test("valid request calls provider once with server-approved context only", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  let providerCalls = 0;
  let providerInput = null;
  const handler = createPublicAssistantHandler(handlerOptions({
    provider: async (input) => {
      providerCalls += 1;
      providerInput = input;
      return { kind: "answer", text: "  Короткий ответ.  " };
    },
  }));

  const response = await handler(event({
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sessionId: "session-1",
    email: "must-not-leak@example.com",
    formMessage: "must not leak",
    authorizationHeader: "must not leak",
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

test("oversized provider output fails closed", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  const handler = createPublicAssistantHandler(handlerOptions({
    provider: async () => ({ kind: "answer", text: "x".repeat(4_001) }),
  }));

  const response = await handler(event({
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/work/jestei/", sourceIds: ["project.jestei"] },
  }));

  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
});

test("provider rate limit and failure become recoverable public states", async () => {
  const { createPublicAssistantHandler } = await loadHandler();
  const request = event({
    message: "Как устроен нестандартный сценарий?",
    locale: "ru",
    sessionId: "session-1",
    context: { currentPath: "/work/jestei/", sourceIds: ["project.jestei"] },
  });

  const limited = createPublicAssistantHandler(handlerOptions({
    provider: async () => ({ kind: "rate_limited" }),
  }));
  assert.equal((await limited(request)).statusCode, 429);

  const unavailable = createPublicAssistantHandler(handlerOptions({
    provider: async () => {
      throw new Error("provider offline");
    },
  }));
  const response = await unavailable(request);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(parse(response), { kind: "unavailable" });
});
