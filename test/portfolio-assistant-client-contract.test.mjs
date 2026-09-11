import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const clientUrl = new URL(
  "../src/features/portfolio-pet/assistant-client.ts",
  import.meta.url,
);

async function loadClient() {
  assert.equal(existsSync(clientUrl), true, "RED: composed assistant client is not implemented yet");
  return import(clientUrl.href);
}

test("prepared assistant reply bypasses the public HTTP transport", async () => {
  const { createPortfolioAssistantClient } = await loadClient();
  let fetchCalls = 0;

  const client = createPortfolioAssistantClient({
    sessionId: "session-prepared",
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("prepared replies must not reach fetch");
    },
  });

  const result = await client.reply({
    message: "Покажи резюме",
    locale: "ru",
    context: { page: "home" },
  });

  assert.equal(result.kind, "prepared");
  assert.equal(fetchCalls, 0);
});

test("free-form assistant reply uses the public transport and returns generated content", async () => {
  const { createPortfolioAssistantClient } = await loadClient();
  let request = null;

  const client = createPortfolioAssistantClient({
    sessionId: "session-generated",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(
        JSON.stringify({
          kind: "answer",
          text: "Короткий grounded ответ.",
          sources: ["project.jestei"],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await client.reply({
    message: "Как этот подход помогает нестандартному сценарию?",
    locale: "ru",
    context: {
      page: "/work/jestei/",
      approvedSourceIds: ["project.jestei"],
      email: "must-not-leak@example.com",
      formMessage: "must not leak",
    },
  });

  assert.equal(request.url, "https://api.looksawful.ru/v1/portfolio-chat");
  assert.deepEqual(JSON.parse(request.init.body), {
    message: "Как этот подход помогает нестандартному сценарию?",
    locale: "ru",
    sessionId: "session-generated",
    context: {
      currentPath: "/work/jestei/",
      sourceIds: ["project.jestei"],
    },
  });
  assert.deepEqual(result, {
    kind: "generated",
    text: "Короткий grounded ответ.",
    sourceIds: ["project.jestei"],
  });
});

test("public backend rate limiting remains a recoverable assistant state", async () => {
  const { createPortfolioAssistantClient } = await loadClient();

  const client = createPortfolioAssistantClient({
    sessionId: "session-limited",
    fetchImpl: async () => new Response("", { status: 429 }),
  });

  const result = await client.reply({
    message: "Как этот подход помогает нестандартному сценарию?",
    locale: "ru",
    context: { page: "/work/jestei/", approvedSourceIds: ["project.jestei"] },
  });

  assert.deepEqual(result, { kind: "rate_limited" });
});
