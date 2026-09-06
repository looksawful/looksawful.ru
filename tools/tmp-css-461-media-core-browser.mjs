import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

import { withE2ERuntime } from "./e2e/runtime.mjs";

const mode = process.argv[2];
const snapshotPath = process.argv[3];
if (!['capture', 'compare'].includes(mode) || !snapshotPath) {
  throw new Error('usage: node tools/tmp-css-461-media-core-browser.mjs <capture|compare> <snapshot.json>');
}

const viewports = [
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1728, height: 1000 },
];

function round(value) {
  return Math.round(value * 1000) / 1000;
}

async function snapshotElement(page, selector) {
  const locator = page.locator(selector).first();
  const count = await locator.count();
  if (count === 0) throw new Error(`missing browser contract target: ${selector}`);

  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const child = element.matches('.media__surface')
      ? element.querySelector(':scope > img, :scope > video, :scope > picture > img')
      : null;
    const childStyle = child ? getComputedStyle(child) : null;
    const childRect = child ? child.getBoundingClientRect() : null;

    const numeric = (value) => Math.round(value * 1000) / 1000;
    return {
      display: style.display,
      position: style.position,
      gap: style.gap,
      minInlineSize: style.minInlineSize,
      minBlockSize: style.minBlockSize,
      marginBlockStart: style.marginBlockStart,
      marginBlockEnd: style.marginBlockEnd,
      alignContent: style.alignContent,
      overflow: style.overflow,
      aspectRatio: style.aspectRatio,
      backgroundColor: style.backgroundColor,
      mediaFit: style.getPropertyValue('--media-fit').trim(),
      mediaPosition: style.getPropertyValue('--media-position').trim(),
      mediaRatio: style.getPropertyValue('--media-ratio').trim(),
      rect: {
        x: numeric(rect.x),
        y: numeric(rect.y),
        width: numeric(rect.width),
        height: numeric(rect.height),
      },
      child: childStyle && childRect ? {
        display: childStyle.display,
        position: childStyle.position,
        objectFit: childStyle.objectFit,
        objectPosition: childStyle.objectPosition,
        inlineSize: childStyle.inlineSize,
        blockSize: childStyle.blockSize,
        translate: childStyle.translate,
        rect: {
          x: numeric(childRect.x),
          y: numeric(childRect.y),
          width: numeric(childRect.width),
          height: numeric(childRect.height),
        },
      } : null,
    };
  });
}

async function collect() {
  return withE2ERuntime(async ({ browser, baseUrl }) => {
    const result = {};
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.emulateMedia({ reducedMotion: 'no-preference' });

      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      result[`home-${viewport.width}x${viewport.height}`] = {
        media: await snapshotElement(page, '.media'),
        surface: await snapshotElement(page, '.media__surface'),
      };

      await page.goto(`${baseUrl}/work/styx/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      result[`styx-${viewport.width}x${viewport.height}`] = {
        centerCrop: await snapshotElement(page, '.media__surface--center-crop'),
        centerCropVideo: await snapshotElement(page, '.media__surface--center-crop > video'),
      };

      await page.close();
    }
    return result;
  });
}

const actual = await collect();
if (mode === 'capture') {
  writeFileSync(snapshotPath, `${JSON.stringify(actual, null, 2)}\n`);
  console.log(`media-core browser baseline written: ${snapshotPath}`);
} else {
  const expected = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  assert.deepEqual(actual, expected);
  console.log('media-core browser snapshot is identical before and after ownership move');
}
