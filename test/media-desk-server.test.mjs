import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createMediaDeskWritePlugin,
  loadContentDeskTextEntries,
  saveMediaDeskMetadata,
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
      ["/__media-desk/metadata", "/__media-desk/texts"],
      "npm run desk mode must register only the Content Desk endpoints",
    );
  } finally {
    if (previous === undefined) delete process.env.CONTENT_DESK_WRITE;
    else process.env.CONTENT_DESK_WRITE = previous;
  }
});
