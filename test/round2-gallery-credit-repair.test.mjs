import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("Round 2 gallery repair 012 restores evidence-backed authorship", () => {
  const obladaet = read("src/data/media/entries/obladaet.ts");
  const styx = read("src/data/media/entries/styx.ts");

  assert.match(
    obladaet,
    /assetId: "obladaet-03-source-01-4x5"[\s\S]{0,500}Арт-обработка: Иван Крушинский \/ 2022\./,
  );

  for (const assetId of [
    "styx-02-source-03-1x1",
    "styx-07-source-02-4x5",
    "styx-07-source-05-4x5",
  ]) {
    const start = styx.indexOf(`assetId: "${assetId}"`);
    assert.notEqual(start, -1, `missing ${assetId}`);
    assert.match(styx.slice(start, start + 700), /Сканография: Иван Крушинский \/ 2022\./);
  }

  for (const assetId of ["styx-05-source-06-4x5", "styx-07-source-03-4x5"]) {
    const occurrences = styx
      .split(`assetId: "${assetId}"`)
      .slice(1)
      .map((chunk) => chunk.slice(0, 700));
    assert.ok(occurrences.length > 0, `missing ${assetId}`);
    for (const occurrence of occurrences) {
      if (occurrence.includes("/ 2022.")) {
        assert.match(occurrence, /Фотограф и продюсер: Иван Крушинский \/ 2022\./);
      }
    }
  }
});
