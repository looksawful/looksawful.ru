import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const ownerPath = new URL("../src/styles/media.css", import.meta.url);

const index = readFileSync(indexPath, "utf8");
const components = readFileSync(componentsPath, "utf8");

test("media core has one canonical base owner before component specializations", () => {
  assert.equal(existsSync(ownerPath), true, "src/styles/media.css must exist");
  assert.match(
    index,
    /@import "\.\/patterns\.css" layer\(patterns\);\n@import "\.\/media\.css" layer\(components\);\n@import "\.\/components\.css" layer\(components\);/,
  );
});

test("components aggregate no longer owns generic media core presentation", () => {
  assert.doesNotMatch(components, /(?:^|\n)\.media\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media__surface\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media__surface\.media__surface--center-crop\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media__surface\.media__surface--center-crop\s*>\s*video\s*\{/);

  // These are deliberately outside Wave 5A and must remain later specializations.
  assert.match(components, /(?:^|\n)\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/);
  assert.match(components, /(?:^|\n)\.media-group\s*\{/);
  assert.match(components, /(?:^|\n)\.brand-system__surface\s*\{/);
});

test("canonical media owner preserves the public sizing and crop API", () => {
  assert.equal(existsSync(ownerPath), true, "media.css must exist");
  if (!existsSync(ownerPath)) return;

  const owner = readFileSync(ownerPath, "utf8");
  assert.match(owner, /\.media\s*\{[\s\S]*--media-fit:\s*cover;[\s\S]*--media-position:\s*center;/);
  assert.match(owner, /\.media__surface\s*\{[\s\S]*--media-ratio:\s*auto;/);
  assert.match(owner, /object-fit:\s*var\(--object-fit,\s*var\(--media-fit\)\);/);
  assert.match(owner, /object-position:\s*var\(--object-position,\s*var\(--media-position\)\);/);
  assert.match(owner, /block-size:\s*var\(--media-block-size,\s*100%\);/);
  assert.match(owner, /&\[data-layout="pair"\]/);
  assert.match(owner, /&\[data-layout="triptych"\]/);
  assert.match(owner, /\.media__surface\.media__surface--center-crop\s*>\s*video\s*\{/);
});

test("Wave 5A owner does not absorb media-group, captions or project integration", () => {
  assert.equal(existsSync(ownerPath), true, "media.css must exist");
  if (!existsSync(ownerPath)) return;

  const owner = readFileSync(ownerPath, "utf8");
  assert.doesNotMatch(owner, /(?:^|\n)\.media-group(?:\s|__|\[|\{|\.)/);
  assert.doesNotMatch(owner, /(?:^|\n)\.media__caption(?:\s|__|\{|\.)/);
  assert.doesNotMatch(owner, /(?:^|\n)\.project__section\s*>/);
  assert.doesNotMatch(owner, /(?:^|\n)\.brand-system__surface\s*\{/);
});
