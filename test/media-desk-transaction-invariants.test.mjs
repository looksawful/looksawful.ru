import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { saveMediaDeskMetadata } from "../src/devtools/media-desk/server.ts";

const ID = "11111111-1111-4111-8111-111111111111";

function revision(source) {
  return createHash("sha256").update(source).digest("hex");
}

function record(overrides = {}) {
  return {
    id: ID,
    mediaType: "image",
    src: `/media/catalog/${ID}.webp`,
    deliverySrc: "",
    posterSrc: "",
    width: 100,
    height: 100,
    durationSeconds: 0,
    mimeType: "image/webp",
    byteLength: 123,
    title: "Original",
    alt: "",
    description: "",
    date: "",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    reusable: true,
    archived: false,
    ...overrides,
  };
}

async function fixture(value) {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-desk-invariants-"));
  const directory = path.join(root, "src/content/media-catalog/uploads");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${ID}.json`);
  const source = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(file, source, "utf8");
  return { root, file, source };
}

test("protected media field is rejected before persistence", async () => {
  const { root, file, source } = await fixture(record());
  try {
    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: ID,
        expectedRevision: revision(source),
        metadata: { src: "/media/changed.webp" },
      }),
      /protected field/i,
    );
    assert.equal(await readFile(file, "utf8"), source);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("canonical parser rejection leaves source byte-identical", async () => {
  const { root, file, source } = await fixture(record({ mediaType: "audio" }));
  try {
    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: ID,
        expectedRevision: revision(source),
        metadata: { title: "Still invalid" },
      }),
      /mediaType/i,
    );
    assert.equal(await readFile(file, "utf8"), source);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
