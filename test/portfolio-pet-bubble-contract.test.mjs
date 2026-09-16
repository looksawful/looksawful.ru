import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const bubble = fs.readFileSync(new URL("../src/components/portfolio-pet-bubble.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/portfolio-pet-bubble.css", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("Awful exposes one compact chat bubble bound to the pet launcher", () => {
  assert.match(bubble, /\[data-portfolio-pet-launcher\]/);
  assert.match(bubble, /dataset\.portfolioPetBubble/);
  assert.match(bubble, /привет\. могу помочь/i);
  assert.match(bubble, /launcher\.append\(bubble\)/);
});

test("bubble follows the pet, disappears during chat and drag, and stays compact on mobile", () => {
  assert.match(css, /\.portfolio-pet__bubble\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /html\.contact-hub-open \.portfolio-pet__bubble/);
  assert.match(css, /\.portfolio-pet\[data-dragging="true"\] \.portfolio-pet__bubble/);
  assert.match(css, /@media \(width <= 42\.5rem\)/);
  assert.doesNotMatch(css, /box-shadow:/);
});

test("bubble runtime is mounted after the pet and cleaned up with the page", () => {
  assert.match(main, /mountPortfolioPetBubble/);
  assert.match(main, /const destroyPortfolioPetBubble = mountPortfolioPetBubble/);
  assert.match(main, /destroyPortfolioPet,[\s\S]*destroyPortfolioPetBubble,[\s\S]*destroyContactHub/);
});
