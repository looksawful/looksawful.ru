import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PageContent composition does not own the known Sensetique/Shootings authored literals", async () => {
  const [sensetiquePage, shootingsPage, sensetiqueSource, shootingsEsmiSource] = await Promise.all([
    read("src/content/pages/cases/sensetique.ts"),
    read("src/content/pages/collections/shootings.ts"),
    read("src/content/cases/sensetique.json"),
    read("src/content/shootings/shootings-esmi.json"),
  ]);

  assert.doesNotMatch(sensetiquePage, /heading:\s*\{\s*text:\s*"Оборудование"\s*\}/);
  assert.doesNotMatch(shootingsPage, /lines:\s*\["Фотограф Иван Крушинский"\]/);

  const sensetique = JSON.parse(sensetiqueSource);
  assert.equal(sensetique.sections.find((section) => section.id === "equipment")?.title, "Оборудование");

  const shootingsEsmi = JSON.parse(shootingsEsmiSource);
  assert.deepEqual(shootingsEsmi.credits, ["Фотограф Иван Крушинский"]);
});
