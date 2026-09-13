import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const serviceUrl = new URL("../src/features/portfolio-pet/portfolio-chat-service.ts", import.meta.url);
const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);

async function loadService() {
  assert.equal(existsSync(serviceUrl), true, "RED: portfolio chat service is not implemented yet");
  return import(serviceUrl.href);
}

async function approvedRouter(sourceIds) {
  const { createPortfolioAssistantRouter } = await import(answersUrl.href);
  return createPortfolioAssistantRouter({ approvedSourceIds: sourceIds });
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
    router: await approvedRouter(["profile.role", "profile.about"]),
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

test("production-default service uses owner-approved evidence and ignores caller-declared approvals", async () => {
  const { createPortfolioChatService } = await loadService();
  let providerCalls = 0;
  let providerInput = null;

  const service = createPortfolioChatService({
    provider: {
      async generate(input) {
        providerCalls += 1;
        providerInput = input;
        return { text: "Я рассказываю только по согласованным данным." };
      },
    },
  });

  const result = await service.reply({
    message: "Как устроено решение?",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["attacker.injected", "profile.contact"],
      phone: "+7 000 000 00 00",
    },
  });

  assert.equal(providerCalls, 1);
  assert.equal(providerInput.kind, "generate");
  assert.deepEqual(providerInput.context.sourceIds, ["project.jestei"]);
  assert.equal(Object.hasOwn(providerInput.context, "approvedSourceIds"), false);
  assert.equal(Object.hasOwn(providerInput.context, "phone"), false);
  assert.deepEqual(result, {
    kind: "generated",
    text: "Я рассказываю только по согласованным данным.",
    sourceIds: ["project.jestei"],
  });
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
    router: await approvedRouter([]),
  });

  const result = await service.reply({
    message: "Как ты относишься к космической архитектуре?",
    locale: "ru",
    context: { page: "home" },
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
    router: await approvedRouter(["profile.about", "project.jestei"]),
  });

  const result = await service.reply({
    message: "Сравни свой подход с нестандартным продуктом",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["attacker.injected"],
      email: "private@example.com",
      formMessage: "secret form draft",
    },
  });

  assert.equal(providerCalls, 1);
  assert.equal(providerInput.kind, "generate");
  assert.deepEqual(providerInput.context.sourceIds, ["project.jestei"]);
  assert.equal(Object.hasOwn(providerInput.context, "email"), false);
  assert.equal(Object.hasOwn(providerInput.context, "formMessage"), false);
  assert.deepEqual(result, {
    kind: "generated",
    text: "Короткий ответ.",
    sourceIds: ["project.jestei"],
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
    router: await approvedRouter(["project.jestei"]),
  });

  const result = await service.reply({
    message: "Расскажи подробнее про дизайн продукта",
    locale: "ru",
    context: { page: "jestei" },
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
    router: await approvedRouter(["project.jestei"]),
  });

  const result = await service.reply({
    message: "Как этот подход масштабируется на необычный сценарий?",
    locale: "ru",
    context: { page: "jestei" },
  });

  assert.deepEqual(result, { kind: "unavailable" });
});

test("transport-style answer becomes a generated service result", async () => {
  const { createPortfolioChatService } = await loadService();

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        return {
          kind: "answer",
          text: "Ответ из public backend.",
          sources: ["project.jestei"],
        };
      },
    },
    router: await approvedRouter(["project.jestei"]),
  });

  const result = await service.reply({
    message: "Как устроено решение для сложного сценария?",
    locale: "ru",
    context: { page: "jestei" },
  });

  assert.deepEqual(result, {
    kind: "generated",
    text: "Ответ из public backend.",
    sourceIds: ["project.jestei"],
  });
});

test("transport-style no_data and rate_limited states survive orchestration", async () => {
  const { createPortfolioChatService } = await loadService();
  const router = await approvedRouter(["project.jestei"]);
  const input = {
    message: "Как устроено решение для сложного сценария?",
    locale: "ru",
    context: { page: "jestei" },
  };

  const noDataService = createPortfolioChatService({
    provider: {
      async generate() {
        return { kind: "no_data", text: "", sources: [] };
      },
    },
    router,
  });
  assert.deepEqual(await noDataService.reply(input), { kind: "no_data" });

  const limitedService = createPortfolioChatService({
    provider: {
      async generate() {
        return { kind: "rate_limited" };
      },
    },
    router,
  });
  assert.deepEqual(await limitedService.reply(input), { kind: "rate_limited" });
});

test("transport-style unavailable state survives orchestration", async () => {
  const { createPortfolioChatService } = await loadService();

  const service = createPortfolioChatService({
    provider: {
      async generate() {
        return { kind: "unavailable" };
      },
    },
    router: await approvedRouter(["project.jestei"]),
  });

  const result = await service.reply({
    message: "Как устроено решение для сложного сценария?",
    locale: "ru",
    context: { page: "jestei" },
  });

  assert.deepEqual(result, { kind: "unavailable" });
});

test("approved free-form strips PII-bearing page metadata before provider context", async () => {
  const { createPortfolioChatService } = await loadService();
  let providerInput = null;

  const service = createPortfolioChatService({
    provider: {
      async generate(input) {
        providerInput = input;
        return { text: "Короткий ответ." };
      },
    },
    router: await approvedRouter(["project.jestei"]),
  });

  const result = await service.reply({
    message: "Как этот подход работает в сложном сценарии?",
    locale: "ru",
    context: {
      page: "https://looksawful.ru/work/jestei/?email=private@example.com#secret",
      email: "private@example.com",
    },
  });

  assert.equal(result.kind, "generated");
  assert.equal(providerInput.context.page, "jestei");
  assert.deepEqual(providerInput.context.sourceIds, ["project.jestei"]);
  assert.equal(JSON.stringify(providerInput.context).includes("private@example.com"), false);
});
