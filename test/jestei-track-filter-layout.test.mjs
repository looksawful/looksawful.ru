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

test("Jestei advanced-filter label has a dedicated no-wrap layout contract", () => {
  const html = renderJesteiTrackFilter(section);

  assert.match(
    html,
    /<link href="\/components\/playlist-filter-workflow-layout\.css" rel="stylesheet">/,
    "the shadow-root filter must load its focused layout stylesheet",
  );

  assert.equal(
    existsSync(fileURLToPath(layoutCssUrl)),
    true,
    "the focused layout stylesheet must exist",
  );

  const css = readFileSync(layoutCssUrl, "utf8");
  assert.match(
    css,
    /\.advanced-button\s*\{[^}]*white-space:\s*nowrap\s*;/s,
    "the advanced-filter control must keep its label on one line",
  );
});
