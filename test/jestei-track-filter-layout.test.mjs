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

test("Jestei initial advanced BPM anatomy fits the audited 154x44 field area", () => {
  const html = renderJesteiTrackFilter(section);
  const css = readLayoutCss();

  assert.match(
    html,
    /data-filter-advanced="true"/,
    "the rendered filter starts in advanced mode, so the advanced BPM fields are the initial user-visible contract",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.bpm-group\s+\.tempo-fields\s*\{[^}]*display:\s*grid\s*;[^}]*grid-template-columns:\s*70px\s+6px\s+70px\s*;[^}]*gap:\s*4px\s*;[^}]*inline-size:\s*154px\s*;[^}]*block-size:\s*44px\s*;/s,
    "advanced BPM fields must fill the 154px column and the 44px content row without inheriting the 62px mobile height",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.bpm-group\s+\.tempo-fields\s+label\s*\{[^}]*inline-size:\s*70px\s*;[^}]*block-size:\s*44px\s*;[^}]*gap:\s*0\s*;/s,
    "advanced BPM labels must fit a 16px label line plus a 28px input exactly inside the 44px row",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.bpm-group\s+\.tempo-fields\s+input\s*\{[^}]*inline-size:\s*70px\s*;[^}]*block-size:\s*28px\s*;/s,
    "advanced BPM inputs must remain symmetric 70x28 controls",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.bpm-group\s+\.tempo-fields__separator\s*\{[^}]*align-self:\s*end\s*;[^}]*inline-size:\s*6px\s*;[^}]*block-size:\s*28px\s*;/s,
    "advanced BPM separator must align to the 28px input row",
  );
});

test("Jestei wide compact BPM anatomy fits the audited 154x44 field area", () => {
  const css = readLayoutCss();

  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.compact-bpm-fields\s*\{[^}]*display:\s*grid\s*;[^}]*grid-template-columns:\s*70px\s+6px\s+70px\s*;[^}]*gap:\s*4px\s*;[^}]*inline-size:\s*154px\s*;[^}]*block-size:\s*44px\s*;/s,
    "compact BPM fields must fill the same 154px column and 44px row when the user leaves advanced mode",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.compact-bpm-fields\s+label\s*\{[^}]*inline-size:\s*70px\s*;[^}]*block-size:\s*44px\s*;[^}]*gap:\s*0\s*;/s,
    "compact BPM labels must not retain their 6px mobile label/input gap inside the 44px wide row",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.compact-bpm-fields\s+input\s*\{[^}]*inline-size:\s*70px\s*;[^}]*block-size:\s*28px\s*;/s,
    "compact BPM inputs must remain symmetric 70x28 controls",
  );
  assert.match(
    css,
    /@container\s+playlist-filter\s*\(inline-size\s*>=\s*768px\)[\s\S]*?\.compact-bpm-separator\s*\{[^}]*align-self:\s*end\s*;[^}]*inline-size:\s*6px\s*;[^}]*block-size:\s*28px\s*;[^}]*padding-block-end:\s*0\s*;/s,
    "compact BPM separator must align to the same 28px input row",
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
