import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const components = read("src/styles/components.css");
const header = read("src/styles/project-header.css");
const index = read("src/styles/index.css");
const captureConfig = read("tools/design-capture/config.mjs");

test("project header canonical owner contains base, wide, compact and typography contracts", () => {
  assert.match(
    header,
    /\.project__head\s*\{[\s\S]*?display:\s*grid;[\s\S]*?font-size:\s*var\(--fs-300\);[\s\S]*?line-height:\s*var\(--lh-heading\);/,
  );
  assert.match(header, /\.project__name\s*\{[\s\S]*?grid-area:\s*project;/);
  assert.match(header, /\.project__role\s*\{[\s\S]*?grid-area:\s*role;/);
  assert.match(header, /\.project__period\s*\{[\s\S]*?grid-area:\s*period;/);
  assert.match(header, /@container project \(width > 50rem\)[\s\S]*?\.project__head\s*\{/);
  assert.match(header, /@container project \(width <= 50rem\)[\s\S]*?\.project__name,[\s\S]*?\.project__head > img/);
});

test("components aggregate no longer owns project header presentation", () => {
  assert.doesNotMatch(
    components,
    /(?:^|\n)\s*\.project__(?:head|name|role|period)(?:\s|>|,|\{|\.)/,
  );
});

test("index no longer carries a late project header patch", () => {
  assert.doesNotMatch(index, /\.project__head\s*\{\s*line-height:\s*var\(--lh-heading\);\s*\}/);
});

test("project header responsive source order and Design Capture ownership stay explicit", () => {
  const base = header.indexOf(".project__head {\n  display: grid;");
  const wide = header.indexOf("@container project (width > 50rem)");
  const compact = header.indexOf("@container project (width <= 50rem)");

  assert.ok(base >= 0, "missing base project header block");
  assert.ok(wide > base, "wide header contract must follow base");
  assert.ok(compact > wide, "compact extension must preserve its later source order");

  const marker = 'name: "project-header"';
  const from = captureConfig.indexOf(marker);
  const to = captureConfig.indexOf("},", from);
  assert.notEqual(from, -1, "missing project-header Design Capture entry");
  assert.notEqual(to, -1, "missing project-header Design Capture boundary");
  const entry = captureConfig.slice(from, to);
  assert.match(entry, /stylesheetHints:\s*\["src\/styles\/project-header\.css"\]/);
  assert.doesNotMatch(entry, /src\/styles\/components\.css/);
});
