import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimePaths = [
  "../src/components/awful-cases-game.js",
  "../public/pets/awful-cases/awful-cases.js",
];

async function readSource(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

function trainingSequence(source) {
  const block = source.match(/const TRAINING_SEQUENCE = \[([\s\S]*?)\];/);
  assert.ok(block, "TRAINING_SEQUENCE must exist");
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

const expectedTrainingSequence = [
  "upper", "upper", "lower", "lower",
  "toggle", "toggle", "title", "title",
  "upper", "toggle", "lower", "title",
  "toggle", "upper", "title", "lower",
];

test("Awful Cases animation always resolves a valid atlas frame", async () => {
  const source = await readSource("../src/components/awful-cases-game.js");
  assert.match(source, /Number\.isFinite\(game\.time\)/);
  assert.match(source, /const frame = RUN\[frameIndex\] \?\? RUN\[0\]/);
});

test("Awful Cases teaches actions first, then switches to mixed recall", async () => {
  for (const runtimePath of runtimePaths) {
    const source = await readSource(runtimePath);
    assert.deepEqual(trainingSequence(source), expectedTrainingSequence, runtimePath);
  }
});

test("Awful Cases only keeps proactive hints for introductions or mistakes", async () => {
  for (const runtimePath of runtimePaths) {
    const source = await readSource(runtimePath);
    assert.match(source, /if \(!task\.showHint && !task\.failed\) return;/, runtimePath);
    assert.match(source, /if \(task\.solved\) continue;/, runtimePath);
  }
});

test("Awful Cases shows session progress and mistakes while running", async () => {
  for (const runtimePath of runtimePaths) {
    const source = await readSource(runtimePath);
    assert.match(source, /function drawSessionHud\(\)/, runtimePath);
    assert.match(source, /game\.solved/, runtimePath);
    assert.match(source, /game\.mistakes/, runtimePath);
    assert.match(source, /drawSessionHud\(\);/, runtimePath);
  }
});

test("Awful Cases teaches the real application modifier chord", async () => {
  for (const runtimePath of runtimePaths) {
    const source = await readSource(runtimePath);
    assert.match(source, /Ctrl\+Alt\+Shift\+/, runtimePath);
  }
});

test("embedded Awful Cases uses Russian action names", async () => {
  const source = await readSource("../src/components/awful-cases-game.js");
  assert.match(source, /return 'верхний регистр'/);
  assert.match(source, /return 'нижний регистр'/);
  assert.match(source, /return 'инверсия регистра'/);
  assert.match(source, /return 'регистр заголовка'/);
});
test("Awful Cases reserves mobile playfield height and hides touch controls on fine pointers", async () => {
  const source = await readSource("../src/styles/components.css");
  assert.match(source, /&\[data-device="browser"\] \.mockup__viewport \{\s*aspect-ratio: 1 \/ 1;/);
  assert.match(source, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.awful-cases-game \.runner-controls \{\s*display: none;/);
});