import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

import { withE2ERuntime } from "./e2e/runtime.mjs";

const mode = process.argv[2];
const snapshotPath = process.argv[3] ?? "/tmp/css460d-project-shell.json";
if (!new Set(["capture", "compare"]).has(mode)) {
  throw new Error("usage: node tools/tmp-css-460-project-shell-browser.mjs <capture|compare> [snapshot.json]");
}

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "wide", width: 1728, height: 1000 },
];

const selectors = [
  ".project",
  ".project__intro",
  ".project__title",
  ".project__summary",
  ".project__lead",
  ".project__links",
  ".project__section",
  ".section-copy",
  ".section-copy__title",
  ".section-copy__text",
];

const styleKeys = [
  "display",
  "position",
  "width",
  "maxWidth",
  "minHeight",
  "paddingTop",
  "paddingBottom",
  "marginTop",
  "marginBottom",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "gridColumnStart",
  "gridColumnEnd",
  "gridTemplateColumns",
  "rowGap",
  "columnGap",
  "overflow",
  "color",
  "backgroundColor",
];

const customProperties = [
  "--project-gutter",
  "--project-media-max",
  "--project-copy-max",
  "--project-section-padding",
  "--project-section-gap",
  "--project-media-gap",
  "--project-media-row-gap",
  "--project-caption-gap",
];

function normalizeNumber(value) {
  return Number(value.toFixed(3));
}

async function captureSnapshot() {
  return withE2ERuntime(async ({ browser, baseUrl }) => {
    const result = {};

    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });

      result[viewport.name] = await page.evaluate(({ selectors, styleKeys, customProperties }) => {
        const snapshot = {};
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (!(element instanceof HTMLElement)) {
            throw new Error(`missing project-shell characterization selector: ${selector}`);
          }
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const values = {};
          for (const key of styleKeys) values[key] = style[key];
          const custom = {};
          for (const property of customProperties) custom[property] = style.getPropertyValue(property).trim();
          snapshot[selector] = {
            style: values,
            custom,
            rect: {
              x: Number(rect.x.toFixed(3)),
              y: Number(rect.y.toFixed(3)),
              width: Number(rect.width.toFixed(3)),
              height: Number(rect.height.toFixed(3)),
            },
          };
        }
        return snapshot;
      }, { selectors, styleKeys, customProperties });

      await page.close();
    }

    return result;
  });
}

const current = await captureSnapshot();
if (mode === "capture") {
  writeFileSync(snapshotPath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`project-shell browser baseline written: ${snapshotPath}`);
} else {
  const expected = JSON.parse(readFileSync(snapshotPath, "utf8"));
  assert.deepStrictEqual(current, expected, "project-shell computed/geometry snapshot changed after CSS ownership move");
  console.log("project-shell browser snapshot is identical before and after ownership move");
}
