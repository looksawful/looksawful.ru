import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Focused regression contract for conversational depth; intentionally independent of mascot rendering.
const serviceUrl = new URL("../src/features/portfolio-pet/portfolio-chat-service.ts", import.meta.url);
const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);
const hubUrl = new URL("../src/components/contact-hub.ts", import.meta.url);

async function createRouter() {
  const { createPortfolioAssistantRouter } = await import(answersUrl.href);
  return createPortfolioAssistantRouter({
    approvedSourceIds: [
      "profile.role",
      "profile.about",
      "profile.contact",
      "profile.skills",
      "profile.principles",
      "profile.product_ui",
      "profile.commercial",
      "project.jestei",
      "project.jestei.interfaces",
    ],
  });
}

function providerProbe() {
  const calls = [];
  return {
    calls,
    provider: {
      async generate(input) {
        calls.push(input);
        return { text: `Ответ ${calls.length}` };
      },
    },
  };
}

test("conversation keeps Jestei evidence through dependent follow-ups", async () => {
  const { createPortfolioChatService } = await import(serviceUrl.href);
  const probe = providerProbe();
  const service = createPortfolioChatService({ provider: probe.provider, router: await createRouter() });

  await service.reply({ message: "Расскажи про Jestei", locale: "ru", context: { page: "home" } });
  await service.reply({ message: "А что ты там сделал с интерфейсами?", locale: "ru", context: { page: "home" } });
  await service.reply({ message: "А конкретный пример?", locale: "ru", context: { page: "home" } });

  assert.equal(probe.calls.length, 3);
  assert.ok(probe.calls[1].context.sourceIds.includes("project.jestei"));
  assert.ok(probe.calls[1].context.sourceIds.includes("project.jestei.interfaces"));
  assert.ok(probe.calls[2].context.sourceIds.includes("project.jestei"));
  assert.ok(Array.isArray(probe.calls[1].context.history));
  assert.ok(probe.calls[1].context.history.some((turn) => turn.role === "user" && /jestei/i.test(turn.text)));
  assert.ok(probe.calls[1].context.history.some((turn) => turn.role === "assistant"));
});

test("commercial intent routes to approved intake/contact context and survives follow-up", async () => {
  const { createPortfolioChatService } = await import(serviceUrl.href);
  const probe = providerProbe();
  const service = createPortfolioChatService({ provider: probe.provider, router: await createRouter() });

  await service.reply({ message: "Хочу заказать у тебя дизайн", locale: "ru", context: { page: "home" } });
  await service.reply({ message: "Что тебе нужно от меня для старта?", locale: "ru", context: { page: "home" } });

  assert.equal(probe.calls.length, 2);
  for (const call of probe.calls) {
    assert.ok(call.context.sourceIds.includes("profile.commercial"));
    assert.ok(call.context.sourceIds.includes("profile.contact"));
  }
  assert.equal(probe.calls[0].context.sourceIds.includes("profile.role"), false, "commercial entry should not restart the bio");
  assert.ok(probe.calls[1].context.history.some((turn) => /заказать/i.test(turn.text)));
});

test("AI mode has no answer-to-contact-form handoff control", async () => {
  const source = await readFile(hubUrl, "utf8");
  assert.doesNotMatch(source, /перенести в сообщение/iu);
  assert.doesNotMatch(source, /contactHubHandoff/iu);
  assert.doesNotMatch(source, /applyExplicitAiDraftHandoff/iu);
});
