import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const featureRoot = new URL("../src/features/portfolio-pet/", import.meta.url);
const viewModelUrl = new URL("view-model.ts", featureRoot);
const componentUrl = new URL("../../components/portfolio-pet.ts", featureRoot);

test("AI portfolio pet shell exposes local-first quick actions", async () => {
  assert.equal(existsSync(viewModelUrl), true, "missing portfolio pet view model");
  assert.equal(existsSync(componentUrl), true, "missing portfolio pet component");

  const viewModel = await import(viewModelUrl);
  const ru = viewModel.getPortfolioPetQuickActions("ru");
  const en = viewModel.getPortfolioPetQuickActions("en");

  assert.deepEqual(
    ru.map(({ id }) => id),
    ["about", "cases", "resume", "writer-email", "writer-application", "game"],
  );
  assert.deepEqual(
    en.map(({ id }) => id),
    ["about", "cases", "resume", "writer-email", "writer-application", "game"],
  );
  assert.ok(ru.every(({ execution }) => execution === "local"));
  assert.ok(en.every(({ execution }) => execution === "local"));
  assert.equal(ru.find(({ id }) => id === "cases")?.label, "Кейсы");
  assert.equal(en.find(({ id }) => id === "cases")?.label, "Cases");

  assert.deepEqual(viewModel.getPortfolioPetShellCopy("ru"), {
    accessibleName: "Открыть помощника по портфолио",
    closeLabel: "Закрыть",
    inputLabel: "Задать вопрос",
    inputPlaceholder: "Спроси о работе, опыте или кейсах",
    submitLabel: "Отправить",
  });
  assert.deepEqual(viewModel.getPortfolioPetShellCopy("en"), {
    accessibleName: "Open portfolio assistant",
    closeLabel: "Close",
    inputLabel: "Ask a question",
    inputPlaceholder: "Ask about work, experience, or cases",
    submitLabel: "Send",
  });
});
