import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const css = await readFile(new URL("../../src/styles/components.css", import.meta.url), "utf8");
const projectShellCss = await readFile(new URL("../../src/styles/project-shell.css", import.meta.url), "utf8");
const mediaDeckCss = await readFile(new URL("../../src/styles/media-deck.css", import.meta.url), "utf8");
const mediaLightboxCss = await readFile(new URL("../../src/styles/media-lightbox.css", import.meta.url), "utf8");

test("project-card caption uses card container without moving the grid breakpoint", () => {
  assert.match(css, /\.project-card\s*{[^}]*container:\s*project-card \/ inline-size;/s);
  assert.match(
    css,
    /@container page-section \(width > 44rem\)\s*{\s*\.projects-grid__list\s*{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*}\s*}/s,
  );
  assert.match(
    css,
    /@container project-card \(width > 30rem\)\s*{\s*\.project-card__caption\s*{[^}]*grid-template-columns:[^}]*max-content;/s,
  );
});

test("project title direct logo fits the full-width heading without distorting its image", () => {
  assert.match(projectShellCss, /\.project__title\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/);
  assert.match(projectShellCss, /&\s*>\s*img\s*\{[^}]*display:\s*block;[^}]*max-inline-size:\s*100%;[^}]*block-size:\s*auto;/);
});

test("media deck dots keep small visual dots on larger hit targets", () => {
  assert.match(mediaDeckCss, /\.media-deck__dot\s*{[^}]*inline-size:\s*1\.5rem;[^}]*block-size:\s*1\.5rem;/s);
  assert.match(mediaDeckCss, /\.media-deck__dot\s*{[^}]*&::before\s*{[^}]*inline-size:\s*0\.45rem;[^}]*block-size:\s*0\.45rem;/s);
  assert.match(mediaDeckCss, /&\[data-active\],[^}]*&\[aria-current="true"\]\s*{\s*&::before\s*{[^}]*background:\s*currentColor;/s);
});

test("lightbox controls and gutters include safe-area insets", () => {
  assert.match(mediaLightboxCss, /padding-block-start:\s*calc\(var\(--media-lightbox-inset\) \+ env\(safe-area-inset-top,\s*0px\)\);/);
  assert.match(mediaLightboxCss, /padding-inline-end:\s*calc\(var\(--media-lightbox-inset\) \+ env\(safe-area-inset-right,\s*0px\)\);/);
  assert.match(mediaLightboxCss, /inset-block-start:\s*calc\(var\(--media-lightbox-control-offset\) \+ env\(safe-area-inset-top,\s*0px\)\);/);
  assert.match(mediaLightboxCss, /inset-inline-end:\s*calc\(var\(--media-lightbox-control-offset\) \+ env\(safe-area-inset-right,\s*0px\)\);/);
});
