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
