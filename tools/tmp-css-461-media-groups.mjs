import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const mediaPath = new URL("../src/styles/media.css", import.meta.url);

const write = process.argv.includes("--write");
const componentsOriginal = readFileSync(componentsPath, "utf8");
const mediaOriginal = readFileSync(mediaPath, "utf8");

const count = (source, marker) => source.split(marker).length - 1;
const requireUnique = (source, marker, label = marker) => {
  assert.equal(count(source, marker), 1, `${label} must occur exactly once`);
};

const takeRange = (source, startMarker, endMarker, label) => {
  requireUnique(source, startMarker, `${label} start`);
  requireUnique(source, endMarker, `${label} end`);
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `${label} markers out of order`);
  return source.slice(start, end);
};

const removeExact = (source, fragment, label) => {
  assert.equal(count(source, fragment), 1, `${label} fragment must occur exactly once`);
  return source.replace(fragment, "");
};

const portfolioGroup = takeRange(
  componentsOriginal,
  ".portfolio-showcase__group {",
  ".media-group.portfolio-showcase__group[data-layout=\"strip\"] {",
  "portfolio group variables",
);
const portfolioStrip = takeRange(
  componentsOriginal,
  ".media-group.portfolio-showcase__group[data-layout=\"strip\"] {",
  ".portfolio-showcase__item .media__caption {",
  "portfolio strip override",
);
const portfolioLogoAndWide = takeRange(
  componentsOriginal,
  ".portfolio-logo-wall {",
  ".projects-grid {",
  "portfolio logo/wide media overrides",
);
const mediaGroups = takeRange(
  componentsOriginal,
  "/* ==================================================\n   Media groups\n   ================================================== */",
  "/* ==================================================\n   Slider and magazine — interaction without motion\n   ================================================== */",
  "media groups architecture",
);

// Wave5A media.css is expected to contain only the canonical Media item owner.
requireUnique(mediaOriginal, "/* ==================================================\n   Media item\n   ================================================== */", "Wave5A media owner");
assert.doesNotMatch(mediaOriginal, /(?:^|\n)\.media-group\s*\{/);
assert.doesNotMatch(mediaOriginal, /(?:^|\n)\.slider\s*\{/);

let componentsNext = componentsOriginal;
componentsNext = removeExact(componentsNext, portfolioGroup, "portfolio group variables");
componentsNext = removeExact(componentsNext, portfolioStrip, "portfolio strip override");
componentsNext = removeExact(componentsNext, portfolioLogoAndWide, "portfolio logo/wide overrides");
componentsNext = removeExact(componentsNext, mediaGroups, "media groups architecture");

const prefix = `${portfolioGroup}${portfolioStrip}${portfolioLogoAndWide}`;
const mediaNext = `${prefix}${mediaOriginal.trimEnd()}\n\n${mediaGroups.trim()}\n`;

// Guard the accelerated package boundary. Interaction owners stay in components.css.
for (const marker of [
  ".slider {",
  ".before-after {",
  ".mockup {",
  ".justified-gallery {",
  ".media-deck {",
  ".media-lightbox {",
  ".page-flip {",
  ".berserk-audio {",
  ".portfolio-showcase__item .media__caption {",
]) {
  assert.ok(componentsNext.includes(marker), `Wave5B must leave ${marker} in components.css`);
  assert.ok(!mediaNext.includes(marker), `Wave5B must not absorb ${marker}`);
}

for (const marker of [
  ".portfolio-showcase__group {",
  ".media-group.portfolio-showcase__group[data-layout=\"strip\"] {",
  ".portfolio-logo-wall {",
  ".media-group {",
  ".media-group.brand-system {",
  ".jestei-event-video-deck {",
  ".media-group[data-layout=\"sequence\"] {",
  ".media-group[data-layout=\"strip\"] {",
  ".media-group[data-layout=\"editorial\"] > .media-group__items {",
  ".media-group[data-layout=\"masonry\"] > .media-group__items {",
  ".media-group[data-layout=\"bento\"] > .media-group__items {",
  "[data-infinite-reel] {",
]) {
  assert.ok(mediaNext.includes(marker), `Wave5B media owner missing ${marker}`);
  assert.ok(!componentsNext.includes(marker), `Wave5B aggregate still owns ${marker}`);
}

const historicalOrder = [
  ".portfolio-showcase__group {",
  ".media-group.portfolio-showcase__group[data-layout=\"strip\"] {",
  ".portfolio-logo-wall {",
  "/* ==================================================\n   Media item",
  "/* ==================================================\n   Media groups",
  ".media-group {",
  ".media-group.brand-system {",
  ".jestei-event-video-deck {",
  ".media-group[data-layout=\"sequence\"] {",
  ".media-group[data-layout=\"strip\"] {",
  ".media-group[data-layout=\"editorial\"] > .media-group__items {",
  ".media-group[data-layout=\"masonry\"] > .media-group__items {",
  ".media-group[data-layout=\"bento\"] > .media-group__items {",
  "[data-infinite-reel] {",
  "@keyframes infinite-reel-scroll",
].map((marker) => {
  const index = mediaNext.indexOf(marker);
  assert.notEqual(index, -1, `missing historical-order marker ${marker}`);
  return index;
});
for (let index = 1; index < historicalOrder.length; index += 1) {
  assert.ok(historicalOrder[index] > historicalOrder[index - 1], `Wave5B historical order drift at ${index}`);
}

console.log(
  JSON.stringify(
    {
      mode: write ? "write" : "dry-run",
      componentsBytesBefore: Buffer.byteLength(componentsOriginal),
      componentsBytesAfter: Buffer.byteLength(componentsNext),
      mediaBytesBefore: Buffer.byteLength(mediaOriginal),
      mediaBytesAfter: Buffer.byteLength(mediaNext),
      movedBytes: Buffer.byteLength(portfolioGroup + portfolioStrip + portfolioLogoAndWide + mediaGroups),
    },
    null,
    2,
  ),
);

if (write) {
  writeFileSync(componentsPath, componentsNext);
  writeFileSync(mediaPath, mediaNext);
}
