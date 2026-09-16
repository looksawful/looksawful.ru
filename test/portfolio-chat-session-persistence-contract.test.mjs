import assert from "node:assert/strict";
import test from "node:test";

const serviceUrl = new URL("../src/features/portfolio-pet/portfolio-chat-service.ts", import.meta.url);
const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);

async function router() {
  const { createPortfolioAssistantRouter } = await import(answersUrl.href);
  return createPortfolioAssistantRouter({
    approvedSourceIds: [
      "profile.role",
      "profile.about",
      "profile.product_ui",
      "project.jestei",
      "project.jestei.interfaces",
    ],
  });
}

function memoryStore() {
  let snapshot = null;
  return {
    load() {
      return snapshot;
    },
    save(value) {
      snapshot = structuredClone(value);
    },
    inspect() {
      return snapshot;
    },
  };
}

test("conversation state survives service recreation through a bounded store", async () => {
  const { createPortfolioChatService } = await import(serviceUrl.href);
  const store = memoryStore();
  const sharedRouter = await router();

  const first = createPortfolioChatService({
    router: sharedRouter,
    conversationStore: store,
    provider: {
      async generate() {
        return { text: "В Jestei я работал над интерфейсами." };
      },
    },
  });

  await first.reply({
    message: "Расскажи про Jestei",
    locale: "ru",
    context: { page: "home" },
  });

  const persisted = store.inspect();
  assert.ok(persisted, "conversation store must receive a snapshot after a successful answer");
  assert.ok(persisted.activeSourceIds.includes("project.jestei"));
  assert.ok(persisted.history.some((turn) => turn.role === "user" && /jestei/i.test(turn.text)));

  let providerInput = null;
  const second = createPortfolioChatService({
    router: sharedRouter,
    conversationStore: store,
    provider: {
      async generate(input) {
        providerInput = input;
        return { text: "Например, быстрый и расширенный режимы фильтрации." };
      },
    },
  });

  const result = await second.reply({
    message: "А конкретный пример?",
    locale: "ru",
    context: { page: "home" },
  });

  assert.equal(result.kind, "generated");
  assert.ok(providerInput.context.sourceIds.includes("project.jestei"));
  assert.ok(providerInput.context.sourceIds.includes("project.jestei.interfaces"));
  assert.ok(providerInput.context.history.some((turn) => turn.role === "assistant" && /интерфейс/i.test(turn.text)));
});
