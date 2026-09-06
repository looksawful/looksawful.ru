import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { renderJesteiTrackFilter } from "../src/components/specialized/jestei-track-filter-canonical.ts";
import { buildJesteiFilterSummary } from "../src/components/specialized/jestei-track-filter-summary.ts";

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

test("Jestei canonical filter does not present seeded summary as live state", () => {
  const html = renderJesteiTrackFilter(section);

  assert.doesNotMatch(
    html,
    /data-summary-seed="true"/,
    "the production filter must not advertise the static demo summary as real state",
  );
  assert.match(
    html,
    /data-summary-seed="pending"/,
    "the migrated seed may exist only as hidden bootstrapping markup until interactive state takes over",
  );
});

test("Jestei selected-filter summary is derived from one normalized state", () => {
  const summary = buildJesteiFilterSummary({
    genres: [
      { value: "House", selection: "included" },
      { value: "Nu Disco", selection: "included" },
      { value: "Techno", selection: "excluded" },
    ],
    tags: [{ value: "Транзишн", selection: "included" }],
    bpm: { min: 80, max: 128, defaultMin: 0, defaultMax: 200 },
    rating: 3,
    top: true,
    trackTypes: [{ value: "Оригинал", selection: "included" }],
    nightParts: [{ value: "Primetime", selection: "included" }],
    keys: [],
  });

  assert.deepEqual(
    summary.map(({ id, label, value, extraCount }) => ({
      id,
      label,
      value,
      extraCount,
    })),
    [
      { id: "genres:included", label: "Жанры:", value: "House", extraCount: 1 },
      {
        id: "genres:excluded",
        label: "Жанры исключены:",
        value: "Techno",
        extraCount: 0,
      },
      { id: "tags:included", label: "Теги:", value: "Транзишн", extraCount: 0 },
      { id: "bpm", label: "BPM:", value: "80–128", extraCount: 0 },
      { id: "rating", label: "Рейтинг:", value: "3 · Топ", extraCount: 0 },
      { id: "track-types:included", label: "Тип:", value: "Оригинал", extraCount: 0 },
      {
        id: "night-parts:included",
        label: "Часть ночи:",
        value: "Primetime",
        extraCount: 0,
      },
    ],
  );
});

test("Jestei summary is empty for the actual default filter state", () => {
  assert.deepEqual(
    buildJesteiFilterSummary({
      genres: [],
      tags: [],
      bpm: { min: 0, max: 200, defaultMin: 0, defaultMax: 200 },
      rating: null,
      top: false,
      trackTypes: [],
      nightParts: [],
      keys: [],
    }),
    [],
  );
});
