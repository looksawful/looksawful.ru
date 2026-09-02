import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { saveMediaDeskMetadata } from "../src/tools/media-desk/server.ts";

const ASSET_ID = "awful-cases-assets-recording-2026-08-15-121210-poster";
const ORIGINAL = {
  id: ASSET_ID,
  mediaType: "image",
  src: "/pets/awful-cases/assets/recording-2026-08-15-121210-poster.webp",
  sourceSrc: "",
  width: 0,
  height: 0,
  durationSeconds: 0,
  mimeType: "",
  byteLength: 0,
  title: "Awful Cases",
  alt: "",
  description: "",
  date: "2024–2026",
  projectIds: ["awful-cases"],
  workAreaIds: [],
  projectTypeIds: [],
  deliverableIds: ["poster"],
  tags: [],
  credits: [],
  reusable: true,
  archived: false,
};

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-desk-"));
  const directory = path.join(root, "src/content/media-catalog/registered");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${ASSET_ID}.json`);
  await writeFile(file, `${JSON.stringify(ORIGINAL, null, 2)}\n`, "utf8");
  return { root, file };
}

test("local writer updates editorial metadata and preserves tooling-owned values", async () => {
  const { root, file } = await fixture();
  try {
    await saveMediaDeskMetadata(root, {
      id: ASSET_ID,
      metadata: {
        title: "Edited title",
        alt: "Edited alt",
        tags: ["edited"],
        archived: true,
      },
    });

    const saved = JSON.parse(await readFile(file, "utf8"));
    assert.equal(saved.title, "Edited title");
    assert.equal(saved.alt, "Edited alt");
    assert.deepEqual(saved.tags, ["edited"]);
    assert.equal(saved.archived, true);
    assert.equal(saved.id, ORIGINAL.id);
    assert.equal(saved.src, ORIGINAL.src);
    assert.equal(saved.width, ORIGINAL.width);
    assert.equal(saved.mediaType, ORIGINAL.mediaType);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local writer rejects protected technical fields without touching the record", async () => {
  const { root, file } = await fixture();
  try {
    const before = await readFile(file, "utf8");
    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: ASSET_ID,
        metadata: { src: "/wrong.webp" },
      }),
      /protected field/i,
    );
    assert.equal(await readFile(file, "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
