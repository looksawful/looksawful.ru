import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  extractManagedMediaTags,
  parseAssetName,
  parseCanonicalRelative,
  ratioToken,
  selectImageWidths,
  setTagAttribute,
} from "../media-system-core.mjs";

test("ratioToken uses standard and reduced ratios", () => {
  assert.equal(ratioToken(1920, 1080), "16x9");
  assert.equal(ratioToken(1400, 935), "3x2");
  assert.equal(ratioToken(1280, 388), "320x97");
});

test("canonical asset path produces opaque id", () => {
  assert.deepEqual(
    parseCanonicalRelative("sensetique/01/03-3x2.webp"),
    {
      project: "sensetique",
      container: "01",
      filename: "03-3x2.webp",
      position: "03",
      ratio: "3x2",
      extension: ".webp",
      type: "image",
      stem: "03-3x2",
      id: "sensetique-01-03",
      relativePath: "sensetique/01/03-3x2.webp",
    },
  );
});

test("canonical image extensions are strict", () => {
  assert.throws(
    () => parseAssetName("01-1x1.png"),
    /Unsupported canonical media extension/,
  );
});

test("responsive widths never enlarge the source", () => {
  assert.deepEqual(
    selectImageWidths(1437),
    [48, 320, 640, 960, 1280, 1437],
  );
  assert.deepEqual(selectImageWidths(200), [48, 200]);
});

test("HTML helpers preserve tag and add attributes", () => {
  const input = '<img alt="" src="./old.webp">';
  const output = setTagAttribute(input, "data-media-item");
  assert.equal(
    output,
    '<img alt="" src="./old.webp" data-media-item>',
  );
});

test("managed media tag extraction is order independent", () => {
  const html = `
    <img src="./a.webp" data-media-id="sands-01-01">
    <video data-media-id='sands-01-02' src="./b.mp4"></video>
  `;
  const records = extractManagedMediaTags(html);

  assert.equal(records.length, 2);
  assert.equal(records[0].id, "sands-01-01");
  assert.equal(records[1].src, "./b.mp4");
});

test("annotator creates canonical figure structure", async () => {
  const project = await mkdtemp(
    path.join(os.tmpdir(), "media-item-annotator-"),
  );
  const tools = path.join(project, "tools", "media");
  const srcGenerated = path.join(project, "src", "generated");

  await mkdir(tools, { recursive: true });
  await mkdir(srcGenerated, { recursive: true });

  const packageRoot = fileURLToPath(
    new URL("../../..", import.meta.url),
  );

  for (const filename of [
    "annotate-media-items.mjs",
    "media-system-core.mjs",
    "media.config.mjs",
  ]) {
    const source = await readFile(
      path.join(packageRoot, "tools", "media", filename),
      "utf8",
    );
    await writeFile(path.join(tools, filename), source, "utf8");
  }

  await writeFile(
    path.join(srcGenerated, "media-manifest.json"),
    JSON.stringify({
      version: 1,
      entries: {
        "sands-01-01": {
          id: "sands-01-01",
          type: "image",
          ratio: "1x1",
          default: {
            src: "./media/generated/projects/sands/01/01-1x1.webp",
            width: 960,
            height: 960,
          },
        },
      },
    }),
  );

  await writeFile(
    path.join(project, "index.html"),
    '<html><head></head><body><figure class="media-gallery__item"><img src="./old.webp" data-media-id="sands-01-01" alt=""></figure></body></html>',
  );

  const result = spawnSync(
    process.execPath,
    [
      path.join(tools, "annotate-media-items.mjs"),
      "--root",
      project,
      "--apply",
    ],
    {
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(path.join(project, "index.html"), "utf8");

  assert.match(html, /data-media-item/);
  assert.match(html, /data-media-surface/);
  assert.match(html, /data-media-caption/);
  assert.match(html, /src="\.\/media\/generated\/projects\/sands\/01\/01-1x1\.webp"/);
  assert.match(html, /src\/components\/media-item\/media-item\.js/);
});
