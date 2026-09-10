import assert from "node:assert/strict";
import test from "node:test";

const featureRoot = new URL("../src/features/portfolio-pet/", import.meta.url);

test("portfolio pet selects project characters from page or active homepage section", async () => {
  const context = await import(new URL("character-context.ts", featureRoot));

  assert.equal(context.resolvePortfolioPetCharacter({ pageId: "home" }), "default");
  assert.equal(context.resolvePortfolioPetCharacter({ pageId: "case:jestei-pool" }), "jestei");
  assert.equal(context.resolvePortfolioPetCharacter({ pageId: "case:styx" }), "styx");
  assert.equal(context.resolvePortfolioPetCharacter({ pageId: "case:sensetique" }), "default");

  assert.equal(
    context.resolvePortfolioPetCharacter({ pageId: "home", activeSectionId: "project-jestei" }),
    "jestei",
  );
  assert.equal(
    context.resolvePortfolioPetCharacter({ pageId: "home", activeSectionId: "project-styx" }),
    "styx",
  );
  assert.equal(
    context.resolvePortfolioPetCharacter({ pageId: "case:jestei-pool", activeSectionId: "project-styx" }),
    "styx",
  );
  assert.equal(
    context.resolvePortfolioPetCharacter({ pageId: "unknown", activeSectionId: "project-unknown" }),
    "default",
  );

  assert.deepEqual(context.getPortfolioPetObservedSections(), ["project-jestei", "project-styx"]);
});

test("prototype character registry keeps visual identity separate from chat state", async () => {
  const context = await import(new URL("character-context.ts", featureRoot));
  const registry = context.getPortfolioPetPrototypeCharacters();

  assert.deepEqual(Object.keys(registry).sort(), ["default", "jestei", "styx"]);
  assert.equal(registry.default.label, "Portfolio");
  assert.equal(registry.jestei.label, "Jestei Pool");
  assert.equal(registry.styx.label, "Styx Jewel");
  assert.notEqual(registry.default.visualVariant, registry.jestei.visualVariant);
  assert.notEqual(registry.jestei.visualVariant, registry.styx.visualVariant);
});
