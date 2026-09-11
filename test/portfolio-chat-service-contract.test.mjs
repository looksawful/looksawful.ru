import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const serviceUrl = new URL("../src/features/portfolio-pet/portfolio-chat-service.ts", import.meta.url);

async function loadService() {
  assert.equal(existsSync(serviceUrl), true, "RED: portfolio chat service is not implemented yet");
  return import(serviceUrl.href);
}

test("AI prepared answers never call the generative provider", async () => {
  const { createPortfolioChatService } = await loadService();
  let providerCalls = 0;

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        providerCalls += 1;
        return { text: "provider should not be called" };
      },
    },
  });

  const result = await service.reply({
    message: "Покажи резюме",
    locale: "ru",
    context: { page: "home" },
  });

  assert.equal(result.kind, "prepared");
  assert.equal(providerCalls, 0);
  assert.ok(result.text.trim().length > 0);
});

test("free-form input without approved evidence returns no_data without calling the provider", async () => {
  const { createPortfolioChatService } = await loadService();
  let providerCalls = 0;

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        providerCalls += 1;
        return { text: "provider should not be called" };
      },
    },
  });

  const result = await service.reply({
    message: "Как ты относишься к космической архитектуре?",
    locale: "ru",
    context: { page: "home", approvedSourceIds: [] },
  });

  assert.equal(result.kind, "no_data");
  assert.equal(providerCalls, 0);
});

test("approved free-form input calls the provider once with only routed safe context", async () => {
  const { createPortfolioChatService } = await loadService();
  let providerCalls = 0;
  let providerInput = null;

  const service = createPortfolioChatService({
    provider: {
      async generate(input) {
        providerCalls += 1;
        providerInput = input;
        return { text: "Короткий ответ." };
      },
    },
  });

  const result = await service.reply({
    message: "Сравни свой подход с нестандартным продуктом",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["profile.about", "project.jestei"],
      email: "private@example.com",
      formMessage: "secret form draft",
    },
  });

  assert.equal(providerCalls, 1);
  assert.equal(providerInput.kind, "generate");
  assert.deepEqual(providerInput.context.sourceIds, ["profile.about", "project.jestei"]);
  assert.equal(Object.hasOwn(providerInput.context, "email"), false);
  assert.equal(Object.hasOwn(providerInput.context, "formMessage"), false);
  assert.deepEqual(result, {
    kind: "generated",
    text: "Короткий ответ.",
    sourceIds: ["profile.about", "project.jestei"],
  });
});

test("provider failure becomes unavailable instead of rejecting the Hub request", async () => {
  const { createPortfolioChatService } = await loadService();

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        throw new Error("provider offline");
      },
    },
  });

  const result = await service.reply({
    message: "Расскажи подробнее про дизайн продукта",
    locale: "ru",
    context: { page: "jestei", approvedSourceIds: ["project.jestei"] },
  });

  assert.deepEqual(result, { kind: "unavailable" });
});

test("blank provider response becomes unavailable instead of an empty generated answer", async () => {
  const { createPortfolioChatService } = await loadService();

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        return { text: "   \n  " };
      },
    },
  });

  const result = await service.reply({
    message: "Как этот подход масштабируется на необычный сценарий?",
    locale: "ru",
    context: { page: "jestei", approvedSourceIds: ["project.jestei"] },
  });

  assert.deepEqual(result, { kind: "unavailable" });
});
