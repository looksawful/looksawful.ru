import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createMediaDeskWritePlugin,
  loadContentDeskTextEntries,
  replaceContentDeskTextLeaf,
  saveContentDeskText,
  saveMediaDeskMetadata,
  saveMediaDeskMetadataBulk,
} from "../src/tools/media-desk/server.ts";

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

const TEXT_DIRECTORIES = [
  "editorial",
  "cases",
  "collections",
  "shootings",
  "standalone-projects",
];

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-desk-"));
  const directory = path.join(root, "src/content/media-catalog/registered");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${ASSET_ID}.json`);
  await writeFile(file, `${JSON.stringify(ORIGINAL, null, 2)}\n`, "utf8");
  return { root, file };
}

async function textFixture(navigation) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-desk-text-"));
  const contentRoot = path.join(root, "src/content");
  await mkdir(contentRoot, { recursive: true });
  for (const directory of TEXT_DIRECTORIES) {
    await mkdir(path.join(contentRoot, directory), { recursive: true });
  }
  const file = path.join(contentRoot, "navigation.json");
  await writeFile(file, `${JSON.stringify(navigation, null, 2)}\n`, "utf8");
  await writeFile(path.join(contentRoot, "projects.json"), "{}\n", "utf8");
  return { root, file };
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

async function bulkFixture(records) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-desk-bulk-"));
  const directory = path.join(root, "src/content/media-catalog/uploads");
  await mkdir(directory, { recursive: true });
  const files = new Map();
  for (const record of records) {
    const file = path.join(directory, `${record.id}.json`);
    await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    files.set(record.id, file);
  }
  return { root, files };
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

test("Content Desk quick edit updates an allowed string and preserves siblings", async () => {
  const original = {
    title: "Old title",
    description: "Keep description",
    nested: { label: "Keep label", count: 2 },
  };
  const { root, file } = await textFixture(original);
  try {
    const entry = await saveContentDeskText(root, {
      sourcePath: "src/content/navigation.json",
      fieldPath: "title",
      value: "New title",
    });
    const source = await readFile(file, "utf8");
    const saved = JSON.parse(source);
    assert.deepEqual(entry, {
      sourcePath: "src/content/navigation.json",
      fieldPath: "title",
      value: "New title",
    });
    assert.deepEqual(saved, { ...original, title: "New title" });
    assert.ok(source.endsWith("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk quick edit allows an empty string", async () => {
  const { root, file } = await textFixture({ title: "Old title" });
  try {
    await saveContentDeskText(root, {
      sourcePath: "src/content/navigation.json",
      fieldPath: "title",
      value: "",
    });
    assert.equal(JSON.parse(await readFile(file, "utf8")).title, "");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk quick edit rejects a structural string field", async () => {
  const { root, file } = await textFixture({ title: "Title", route: "/protected" });
  try {
    const before = await readFile(file, "utf8");
    await assert.rejects(
      saveContentDeskText(root, {
        sourcePath: "src/content/navigation.json",
        fieldPath: "route",
        value: "/changed",
      }),
      /not editable/i,
    );
    assert.equal(await readFile(file, "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk quick edit rejects an unknown source", async () => {
  const { root } = await textFixture({ title: "Title" });
  try {
    await assert.rejects(
      saveContentDeskText(root, {
        sourcePath: "src/content/not-in-desk.json",
        fieldPath: "title",
        value: "Changed",
      }),
      /not editable/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk quick edit rejects an unknown field path", async () => {
  const { root } = await textFixture({ title: "Title" });
  try {
    await assert.rejects(
      saveContentDeskText(root, {
        sourcePath: "src/content/navigation.json",
        fieldPath: "missing",
        value: "Changed",
      }),
      /not editable/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk leaf writer rejects a value that is no longer a string", () => {
  assert.throws(
    () => replaceContentDeskTextLeaf({ section: { title: 42 } }, "section.title", "Changed"),
    /must still be a string/i,
  );
});

test("Content Desk quick edit supports an existing string through an array index path", async () => {
  const original = {
    sections: [
      { heading: "First heading", body: "Keep body" },
      { heading: "Second heading", body: "Keep second body" },
    ],
  };
  const { root, file } = await textFixture(original);
  try {
    await saveContentDeskText(root, {
      sourcePath: "src/content/navigation.json",
      fieldPath: "sections.0.heading",
      value: "Edited heading",
    });
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")), {
      sections: [
        { heading: "Edited heading", body: "Keep body" },
        { heading: "Second heading", body: "Keep second body" },
      ],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bulk writer updates multiple valid assets only after prevalidation", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const second = uploadedRecord("22222222-2222-4222-8222-222222222222", "Second");
  const { root, files } = await bulkFixture([first, second]);
  try {
    const records = await saveMediaDeskMetadataBulk(root, [
      { id: first.id, metadata: { title: "First edited", archived: true } },
      { id: second.id, metadata: { alt: "Second alt", tags: ["edited"] } },
    ]);
    assert.equal(records.length, 2);
    const firstSaved = JSON.parse(await readFile(files.get(first.id), "utf8"));
    const secondSaved = JSON.parse(await readFile(files.get(second.id), "utf8"));
    assert.equal(firstSaved.title, "First edited");
    assert.equal(firstSaved.archived, true);
    assert.equal(secondSaved.alt, "Second alt");
    assert.deepEqual(secondSaved.tags, ["edited"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bulk writer rejects a protected field before writing any record", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const second = uploadedRecord("22222222-2222-4222-8222-222222222222", "Second");
  const { root, files } = await bulkFixture([first, second]);
  try {
    const beforeFirst = await readFile(files.get(first.id), "utf8");
    const beforeSecond = await readFile(files.get(second.id), "utf8");
    await assert.rejects(
      saveMediaDeskMetadataBulk(root, [
        { id: first.id, metadata: { title: "Would change" } },
        { id: second.id, metadata: { src: "/wrong.webp" } },
      ]),
      /protected field/i,
    );
    assert.equal(await readFile(files.get(first.id), "utf8"), beforeFirst);
    assert.equal(await readFile(files.get(second.id), "utf8"), beforeSecond);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bulk writer rejects an unknown asset id before writing any record", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const { root, files } = await bulkFixture([first]);
  try {
    const before = await readFile(files.get(first.id), "utf8");
    await assert.rejects(
      saveMediaDeskMetadataBulk(root, [
        { id: first.id, metadata: { title: "Would change" } },
        { id: "33333333-3333-4333-8333-333333333333", metadata: { title: "Missing" } },
      ]),
      /was not found/i,
    );
    assert.equal(await readFile(files.get(first.id), "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bulk writer rejects an invalid existing record before writing any record", async () => {
  const first = uploadedRecord("11111111-1111-4111-8111-111111111111", "First");
  const invalid = {
    ...uploadedRecord("22222222-2222-4222-8222-222222222222", "Second"),
    mediaType: "audio",
  };
  const { root, files } = await bulkFixture([first, invalid]);
  try {
    const beforeFirst = await readFile(files.get(first.id), "utf8");
    const beforeInvalid = await readFile(files.get(invalid.id), "utf8");
    await assert.rejects(
      saveMediaDeskMetadataBulk(root, [
        { id: first.id, metadata: { title: "Would change" } },
        { id: invalid.id, metadata: { title: "Still invalid" } },
      ]),
      /mediaType/i,
    );
    assert.equal(await readFile(files.get(first.id), "utf8"), beforeFirst);
    assert.equal(await readFile(files.get(invalid.id), "utf8"), beforeInvalid);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Content Desk text loader indexes the real CMS-owned content tree", async () => {
  const entries = await loadContentDeskTextEntries(process.cwd());
  assert.ok(entries.length > 0, "real content tree must produce text entries");
  assert.ok(entries.some(({ sourcePath }) => sourcePath === "src/content/navigation.json"));
  assert.ok(entries.some(({ sourcePath }) => sourcePath.startsWith("src/content/editorial/")));
  assert.ok(entries.every(({ sourcePath }) => !sourcePath.includes("/media-catalog/")));
});

test("Content Desk middleware is registered only for explicit Desk mode", () => {
  const previous = process.env.CONTENT_DESK_WRITE;
  try {
    const routes = [];
    const server = {
      middlewares: {
        use(pathname, handler) {
          routes.push([pathname, handler]);
        },
      },
    };

    delete process.env.CONTENT_DESK_WRITE;
    createMediaDeskWritePlugin(process.cwd()).configureServer(server);
    assert.equal(routes.length, 0, "ordinary vite dev must remain read-only");

    process.env.CONTENT_DESK_WRITE = "1";
    createMediaDeskWritePlugin(process.cwd()).configureServer(server);
    assert.deepEqual(
      routes.map(([pathname]) => pathname).sort(),
      ["/__media-desk/metadata", "/__media-desk/metadata/bulk", "/__media-desk/texts"],
      "npm run desk mode must register only the Content Desk endpoints",
    );
    assert.ok(
      routes.findIndex(([pathname]) => pathname === "/__media-desk/metadata/bulk")
        < routes.findIndex(([pathname]) => pathname === "/__media-desk/metadata"),
      "bulk route must be registered before the metadata prefix route",
    );
  } finally {
    if (previous === undefined) delete process.env.CONTENT_DESK_WRITE;
    else process.env.CONTENT_DESK_WRITE = previous;
  }
});
