import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Shootings hash freeze is opt-in and enabled only by the specialized early guard", async () => {
  const isolationTest = await read("test/shootings-data-isolation.test.mjs");
  const workflow = await read(".github/workflows/verify-shootings-data-integration.yml");

  assert.match(isolationTest, /SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION/);
  assert.match(isolationTest, /process\.env\.SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION\s*===\s*["']1["']/);

  const stepStart = workflow.indexOf("      - name: Verify presentation isolation first");
  assert.notEqual(stepStart, -1);
  const nextStep = workflow.indexOf("\n      - name: ", stepStart + 1);
  const guardStep = workflow.slice(stepStart, nextStep === -1 ? workflow.length : nextStep);

  assert.match(guardStep, /SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION:\s*["']?1["']?/);
  assert.match(guardStep, /shootings-data-isolation\.test\.mjs/);

  const coreStepStart = workflow.indexOf("      - name: Core tests");
  assert.notEqual(coreStepStart, -1);
  const coreNextStep = workflow.indexOf("\n      - name: ", coreStepStart + 1);
  const coreStep = workflow.slice(coreStepStart, coreNextStep === -1 ? workflow.length : coreNextStep);
  assert.doesNotMatch(coreStep, /SHOOTINGS_ENFORCE_PRESENTATION_ISOLATION/);
});
