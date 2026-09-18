import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { classifySvgMarkup } from "../tools/logo-3d/audit-logo-svg-sources.mjs";

const read = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("classifies real vector SVG sources", async () => {
  for (const path of [
    "public/favicon.svg",
    "public/media/projects/jestei/logo/source/logo-secondary.svg",
    "public/media/projects/lyve/logo/source/01-lyve-logo.svg",
    "public/media/projects/progresstrad/logo/source/02-progresstrad-vector-recovered.svg",
    "public/media/projects/sensetique/logo/sensetique_logo_svg/02_lockups/112_lockups_r18_c01.svg",
  ]) {
    assert.equal(classifySvgMarkup(await read(path)).kind, "vector-svg", path);
  }
});

test("classifies embedded raster wrappers", async () => {
  for (const path of [
    "public/media/projects/styx/logo/source/02-styx-logo.svg",
    "public/media/projects/line/logo/source/01-line-logo.svg",
    "public/media/projects/progresstrad/logo/source/01-progresstrad-logo.svg",
  ]) {
    assert.equal(classifySvgMarkup(await read(path)).kind, "raster-wrapper", path);
  }
});