import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  loadContentDeskTextEntries,
  saveContentDeskText,
  saveMediaDeskMetadata,
  saveMediaDeskMetadataBulk,
} from "../src/devtools/media-desk/server.ts";

function revision(source) {
  return createHash("sha256").update(source).digest("hex");
}

function uploadedRecord(id, title) {
  return {
    id,
    mediaType: "image",
    src: `/media/catalog/${id}.webp`,
    deliverySrc: "",
    posterSrc: "",
    width: 100,
    height: 100,
    durationSeconds: 0,
    mimeType: "image/webp",
    byteLength: 123,
    title,
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
  };
}

async function fixture(records) {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-desk-transactions-"));
  const directory = path.join(root, "src/content/media-catalog/uploads");
  await mkdir(directory, { recursive: true });
  const files = new Map();
  for (const record of records) {
    const file = path.join(directory, `${record.id}.json`);
    const source = `${JSON.stringify(record, null, 2)}\n`;
    await writeFile(file, source, "utf8");
    files.set(record.id, file);
  }
  return { root, files };
}

async function textFixture(navigation) {
  const root = await mkdtemp(path.join(os.tmpdir(), "text-desk-transactions-"));
  const contentRoot = path.join(root, "src/content");
  for (const directory of [
    "editorial",
    "cases",
    "collections",
    "shootings",
    "standalone-projects",
  ]) {
    await mkdir(path.join(contentRoot, directory), { recursive: true });
  }
  const file = path.join(contentRoot, "navigation.json");
  await writeFile(file, `${JSON.stringify(navigation, null, 2)}\n`, "utf8");
  await writeFile(path.join(contentRoot, "projects.json"), "{}\n", "utf8");
  return { root, file };
}

test("single media mutation requires expectedRevision", async () => {
  const record = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const { root, files } = await fixture([record]);
  try {
    const file = files.get(record.id);
    const before = await readFile(file, "utf8");
    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: record.id,
        metadata: { title: "Must not write" },
      }),
      /expectedRevision/i,
    );
    assert.equal(await readFile(file, "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("single media mutation accepts the exact current revision", async () => {
  const record = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const { root, files } = await fixture([record]);
  try {
    const file = files.get(record.id);
    const before = await readFile(file, "utf8");
    const saved = await saveMediaDeskMetadata(root, {
      id: record.id,
      expectedRevision: revision(before),
      metadata: { title: "Edited" },
    });
    assert.equal(saved.title, "Edited");
    assert.equal(JSON.parse(await readFile(file, "utf8")).title, "Edited");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale media mutation is rejected and preserves newer bytes", async () => {
  const record = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const { root, files } = await fixture([record]);
  try {
    const file = files.get(record.id);
    const original = await readFile(file, "utf8");
    const newerRecord = { ...record, title: "Newer disk value" };
    const newer = `${JSON.stringify(newerRecord, null, 2)}\n`;
    await writeFile(file, newer, "utf8");

    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: record.id,
        expectedRevision: revision(original),
        metadata: { title: "Stale overwrite" },
      }),
      /stale|conflict|revision/i,
    );
    assert.equal(await readFile(file, "utf8"), newer);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bulk revision conflict writes no files", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const second = uploadedRecord("22222222-2222-4222-8222-222222222222", "Second");
  const { root, files } = await fixture([first, second]);
  try {
    const firstFile = files.get(first.id);
    const secondFile = files.get(second.id);
    const firstBefore = await readFile(firstFile, "utf8");
    const secondBefore = await readFile(secondFile, "utf8");

    await assert.rejects(
      saveMediaDeskMetadataBulk(root, [
        {
          id: first.id,
          expectedRevision: revision(firstBefore),
          metadata: { title: "Would change" },
        },
        {
          id: second.id,
          expectedRevision: "0".repeat(64),
          metadata: { title: "Stale" },
        },
      ]),
      /stale|conflict|revision/i,
    );

    assert.equal(await readFile(firstFile, "utf8"), firstBefore);
    assert.equal(await readFile(secondFile, "utf8"), secondBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("mid-bulk persistence failure rolls back already replaced files", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const second = uploadedRecord("22222222-2222-4222-8222-222222222222", "Second");
  const { root, files } = await fixture([first, second]);
  try {
    const firstFile = files.get(first.id);
    const secondFile = files.get(second.id);
    const firstBefore = await readFile(firstFile, "utf8");
    const secondBefore = await readFile(secondFile, "utf8");

    await assert.rejects(
      saveMediaDeskMetadataBulk(
        root,
        [
          {
            id: first.id,
            expectedRevision: revision(firstBefore),
            metadata: { title: "First edited" },
          },
          {
            id: second.id,
            expectedRevision: revision(secondBefore),
            metadata: { title: "Second edited" },
          },
        ],
        {
          beforeReplace({ index }) {
            if (index === 1) throw new Error("injected bulk failure");
          },
        },
      ),
      /injected bulk failure/i,
    );

    assert.equal(await readFile(firstFile, "utf8"), firstBefore);
    assert.equal(await readFile(secondFile, "utf8"), secondBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("text index exposes the exact source revision and save advances it", async () => {
  const { root, file } = await textFixture({ title: "Old", route: "/protected" });
  try {
    const before = await readFile(file, "utf8");
    const entry = (await loadContentDeskTextEntries(root)).find(
      (item) => item.sourcePath === "src/content/navigation.json" && item.fieldPath === "title",
    );
    assert.equal(entry?.revision, revision(before));

    const saved = await saveContentDeskText(root, {
      sourcePath: "src/content/navigation.json",
      fieldPath: "title",
      value: "New",
      expectedRevision: entry.revision,
    });
    const after = await readFile(file, "utf8");
    assert.equal(JSON.parse(after).title, "New");
    assert.equal(JSON.parse(after).route, "/protected");
    assert.equal(saved.revision, revision(after));
    assert.notEqual(saved.revision, entry.revision);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stale text mutation is rejected and preserves newer bytes", async () => {
  const { root, file } = await textFixture({ title: "Old" });
  try {
    const before = await readFile(file, "utf8");
    const newer = `${JSON.stringify({ title: "Newer" }, null, 2)}\n`;
    await writeFile(file, newer, "utf8");

    await assert.rejects(
      saveContentDeskText(root, {
        sourcePath: "src/content/navigation.json",
        fieldPath: "title",
        value: "Stale",
        expectedRevision: revision(before),
      }),
      /conflict|revision/i,
    );
    assert.equal(await readFile(file, "utf8"), newer);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
