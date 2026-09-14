import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourcePath = "src/content/subproject-card-covers.json";

test("subproject cover overrides are an isolated CMS-owned mapping", async () => {
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  assert.deepEqual(source, {});
  const module = await import("../src/data/subproject-cards.ts");
  assert.equal(module.petProjectCards.find(({ id }) => id === "awful-cases")?.coverEntryId, "awful-cases-assets-screenshot-2026-08-14-174113-use-01");
  assert.equal(module.shootingCardGroups.flatMap(({ cards }) => cards).find(({ id }) => id === "choose-your-character")?.coverEntryId, "behance-choose-your-character-cover-use-01");
});

test("cover override helper changes only coverEntryId for known card owners", async () => {
  const { applySubprojectCardCoverOverrides } = await import("../src/data/subproject-cards.ts");
  const cards = [{ id: "pet-a", title: "A", description: "D", coverEntryId: "old", shape: "square" }];
  const next = applySubprojectCardCoverOverrides(cards, { "pet-a": "new-entry" });
  assert.deepEqual(next, [{ id: "pet-a", title: "A", description: "D", coverEntryId: "new-entry", shape: "square" }]);
  assert.throws(() => applySubprojectCardCoverOverrides(cards, { unknown: "new-entry" }), /unknown subproject card cover owner/i);
});
