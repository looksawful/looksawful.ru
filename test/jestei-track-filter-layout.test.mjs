import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { renderJesteiTrackFilter } from "../src/components/specialized/jestei-track-filter-canonical.ts";

const section = {
  type: "specialized",
  kind: "jestei-track-filter",
  id: "jestei-track-filter",
  projectId: "jestei-track-filter",
};

const layoutCssUrl = new URL(
  "../public/components/playlist-filter-workflow-layout.css",
  import.meta.url,
);

function readLayoutCss() {
  assert.equal(
    existsSync(fileURLToPath(layoutCssUrl)),
    true,
    "the focused layout stylesheet must exist",
  );
  return readFileSync(layoutCssUrl, "utf8");
}

test("Jestei advanced-filter label has a dedicated no-wrap layout contract", () => {
  const html = renderJesteiTrackFilter(section);

  assert.match(
    html,
    /<link href="\/components\/playlist-filter-workflow-layout\.css" rel="stylesheet">/,
    "the shadow-root filter must load its focused layout stylesheet",
  );

  assert.match(
    readLayoutCss(),
    /\.advanced-button\s*\{[^}]*white-space:\s*nowrap\s*;/s,
    "the advanced-filter control must keep its label on one line",
  );
});

test("Jestei compact BPM labels stay on one line", () => {
  assert.match(
    readLayoutCss(),
    /\.compact-bpm-fields\s+label\s*\{[^}]*white-space:\s*nowrap\s*;/s,
    "BPM Min/Max labels must not wrap or clip vertically",
  );
});

test("Jestei BPM value row stays visually attached to the range control", () => {
  assert.match(
    readLayoutCss(),
    /\.tempo-main,\s*\.compact-bpm-slider\s*\{[^}]*gap:\s*6px\s*;/s,
    "BPM title, values and rail must fit the fixed 62px block without separating the values from the range",
  );
});

test("Jestei track-type options stay in one horizontal row", () => {
  const css = readLayoutCss();

  assert.match(
    css,
    /\.check-options--track-type\s*\{[^}]*flex-wrap:\s*nowrap\s*;[^}]*block-size:\s*16px\s*;/s,
    "Remix and Original must remain one horizontal checkbox row",
  );
  assert.match(
    css,
    /\.type-shell\s*\{[^}]*block-size:\s*48px\s*;/s,
    "the track-type fieldset must not retain the old two-row height",
  );
});
