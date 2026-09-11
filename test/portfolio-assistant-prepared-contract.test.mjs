import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);

async function loadPreparedAnswers() {
  assert.equal(existsSync(answersUrl), true, "RED: prepared-answer resolver is not implemented yet");
  return import(answersUrl.href);
}

test("AI-002/AI-003/AI-008: common portfolio questions resolve as prepared answers", async () => {
  const { routePortfolioAssistantRequest } = await loadPreparedAnswers();

  for (const message of [
    "Расскажи о себе",
    "Какие у тебя кейсы?",
    "Покажи резюме",
    "What projects have you worked on?",
  ]) {
    const result = routePortfolioAssistantRequest({ message, locale: message.startsWith("What") ? "en" : "ru", context: { page: "home" } });
    assert.equal(result.kind, "prepared", `${message} should stay on the prepared path`);
    assert.equal(typeof result.answerId, "string");
    assert.ok(result.answerId.length > 0);
    assert.ok(Array.isArray(result.sourceIds));
  }
});

test("AI-005/AI-007: natural-language variants map to prepared intent only when confidence is sufficient", async () => {
  const { routePortfolioAssistantRequest } = await loadPreparedAnswers();

  const canonical = routePortfolioAssistantRequest({ message: "Кейсы", locale: "ru", context: { page: "home" } });
  const natural = routePortfolioAssistantRequest({ message: "Что из работ можно посмотреть?", locale: "ru", context: { page: "home" } });
  assert.equal(canonical.kind, "prepared");
  assert.equal(natural.kind, "prepared");
  assert.equal(natural.answerId, canonical.answerId);

  const ambiguous = routePortfolioAssistantRequest({ message: "А как ты вообще к этому относишься?", locale: "ru", context: { page: "home" } });
  assert.equal(ambiguous.kind, "generate", "ambiguous free-form input must not be forced into a prepared answer");
});

test("AI-011/AI-012/PRV-005: generative fallback contains only approved safe context", async () => {
  const { routePortfolioAssistantRequest } = await loadPreparedAnswers();

  const result = routePortfolioAssistantRequest({
    message: "Сравни мой запрос с твоим опытом нестандартно",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["profile-summary", "project-jestei"],
      email: "private@example.com",
      formMessage: "secret form draft",
    },
  });

  assert.equal(result.kind, "generate");
  assert.deepEqual(result.context.sourceIds, ["profile-summary", "project-jestei"]);
  assert.equal(Object.hasOwn(result.context, "email"), false);
  assert.equal(Object.hasOwn(result.context, "formMessage"), false);
  assert.equal(Object.hasOwn(result.context, "fullKnowledgeBase"), false);
});

test("AI-009: prepared answer content is usable without provider availability", async () => {
  const { routePortfolioAssistantRequest } = await loadPreparedAnswers();
  const result = routePortfolioAssistantRequest({
    message: "Покажи резюме",
    locale: "ru",
    context: { page: "home", providerAvailable: false },
  });
  assert.equal(result.kind, "prepared");
  assert.equal(typeof result.text, "string");
  assert.ok(result.text.trim().length > 0);
});
