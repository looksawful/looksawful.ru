import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);

async function loadPreparedAnswers() {
  assert.equal(existsSync(answersUrl), true, "RED: prepared-answer resolver is not implemented yet");
  return import(answersUrl.href);
}

const approvedFixtureIds = Object.freeze([
  "profile.about",
  "profile.role",
  "project.jestei",
]);

test("AI-002/AI-003/AI-008: approved common portfolio questions resolve as prepared answers", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: approvedFixtureIds,
  });

  for (const message of [
    "Расскажи о себе",
    "Покажи резюме",
  ]) {
    const result = routePortfolioAssistantRequest({ message, locale: "ru", context: { page: "home" } });
    assert.equal(result.kind, "prepared", `${message} should stay on the prepared path when its sources are approved`);
    assert.equal(typeof result.answerId, "string");
    assert.ok(result.answerId.length > 0);
    assert.ok(Array.isArray(result.sourceIds));
    assert.ok(result.sourceIds.every((sourceId) => approvedFixtureIds.includes(sourceId)));
  }
});

test("AI-003/AI-012/SEC-010: prepared intent fails closed when required sources are not approved", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: [] });

  const result = routePortfolioAssistantRequest({
    message: "Расскажи о себе",
    locale: "ru",
    context: { page: "home" },
  });

  assert.deepEqual(result, { kind: "no_data" });
});

test("AI-005/AI-007: natural-language variants map to prepared intent only when confidence is sufficient", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: ["project.jestei"],
  });

  const canonical = routePortfolioAssistantRequest({ message: "Кейсы", locale: "ru", context: { page: "home" } });
  const natural = routePortfolioAssistantRequest({ message: "Что из работ можно посмотреть?", locale: "ru", context: { page: "home" } });
  assert.equal(canonical.kind, "prepared");
  assert.equal(natural.kind, "prepared");
  assert.equal(natural.answerId, canonical.answerId);

  const ambiguous = routePortfolioAssistantRequest({ message: "А как ты вообще к этому относишься?", locale: "ru", context: { page: "home" } });
  assert.equal(ambiguous.kind, "generate", "ambiguous free-form input must not be forced into a prepared answer");
});

test("AI-011/AI-012/AI-013/PRV-005/SEC-010: caller cannot self-approve generative evidence", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: ["profile.about", "project.jestei"],
  });

  const result = routePortfolioAssistantRequest({
    message: "Сравни мой запрос с твоим опытом нестандартно",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["attacker.injected", "profile.role"],
      email: "private@example.com",
      formMessage: "secret form draft",
    },
  });

  assert.equal(result.kind, "generate");
  assert.deepEqual(result.context.sourceIds, ["project.jestei"]);
  assert.equal(Object.hasOwn(result.context, "email"), false);
  assert.equal(Object.hasOwn(result.context, "formMessage"), false);
  assert.equal(Object.hasOwn(result.context, "fullKnowledgeBase"), false);
});

test("AI-011/AI-012: unknown ids in the trusted approval list fail closed instead of becoming evidence", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: ["does.not.exist", "project.jestei"],
  });

  const result = routePortfolioAssistantRequest({
    message: "Расскажи подробнее про этот проект",
    locale: "ru",
    context: { page: "jestei" },
  });

  assert.equal(result.kind, "generate");
  assert.deepEqual(result.context.sourceIds, ["project.jestei"]);
});

test("AI-009: approved prepared answer content is usable without provider availability", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: ["profile.role", "profile.about"],
  });
  const result = routePortfolioAssistantRequest({
    message: "Покажи резюме",
    locale: "ru",
    context: { page: "home", providerAvailable: false },
  });
  assert.equal(result.kind, "prepared");
  assert.equal(typeof result.text, "string");
  assert.ok(result.text.trim().length > 0);
});
