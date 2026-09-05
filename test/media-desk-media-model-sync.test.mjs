import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildBulkMetadataRequest,
} from "../src/devtools/media-desk/bulk-editor-model.ts";
import {
  buildMediaEditorialPatch,
} from "../src/devtools/media-desk/editor-serialization.ts";
import {
  saveMediaDeskMetadata,
} from "../src/devtools/media-desk/server.ts";

const REGISTERED_ID = "jestei-02-source-01-16x10";
const UPLOAD_ID = "11111111-1111-4111-8111-111111111111";

const baseMetadata = {
  title: "Asset",
  alt: "",
  description: "",
  date: "",
  projectIds: ["jestei-core-interface"],
  workAreaIds: ["graphic-design"],
  projectTypeIds: [],
  deliverableIds: [],
  tags: [],
  credits: [],
  reusable: true,
  archived: false,
};

function editorValues(overrides = {}) {
  return {
    ...baseMetadata,
    ...overrides,
  };
}

function registeredItem(overrides = {}) {
  return {
    origin: "registered",
    asset: {
      id: REGISTERED_ID,
      type: "image",
      src: "/media/projects/jestei/02/source-01-16x10.webp",
    },
    ...baseMetadata,
    ...overrides,
  };
}

function uploadedItem(overrides = {}) {
  return {
    origin: "cms",
    asset: {
      id: `cms-${UPLOAD_ID}`,
      type: "image",
      src: `/media/catalog/${UPLOAD_ID}.webp`,
    },
    ...baseMetadata,
    ...overrides,
  };
}

function compactRegisteredRecord() {
  return {
    id: REGISTERED_ID,
    title: "Asset",
    alt: "",
    description: "",
    date: "",
    workAreaIds: ["graphic-design"],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    reusable: true,
    archived: false,
  };
}

function uploadedRecord() {
  return {
    id: UPLOAD_ID,
    mediaType: "image",
    src: `/media/catalog/${UPLOAD_ID}.webp`,
    deliverySrc: "",
    posterSrc: "",
    width: 100,
    height: 100,
    durationSeconds: 0,
    mimeType: "image/webp",
    byteLength: 123,
    ...baseMetadata,
  };
}

async function mediaFixture({ registered = false, uploaded = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "media-desk-model-sync-"));
  const registeredDir = path.join(root, "src/content/media-catalog/registered");
  const uploadsDir = path.join(root, "src/content/media-catalog/uploads");
  await mkdir(registeredDir, { recursive: true });
  await mkdir(uploadsDir, { recursive: true });

  if (registered) {
    await writeFile(
      path.join(registeredDir, `${REGISTERED_ID}.json`),
      `${JSON.stringify(compactRegisteredRecord(), null, 2)}\n`,
      "utf8",
    );
  }
  if (uploaded) {
    await writeFile(
      path.join(uploadsDir, `${UPLOAD_ID}.json`),
      `${JSON.stringify(uploadedRecord(), null, 2)}\n`,
      "utf8",
    );
  }

  return { root, registeredDir, uploadsDir };
}

test("registered Pages CMS collection does not expose asset-level projectIds", async () => {
  const source = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = source.indexOf("      - name: registered-media-catalog\n");
  const end = source.indexOf("      - name: uploaded-media-catalog\n", start);
  assert.ok(start >= 0 && end > start, "registered and uploaded media CMS blocks must exist");
  const registered = source.slice(start, end);
  const uploaded = source.slice(end);

  assert.doesNotMatch(registered, /\n\s+- name: projectIds\b/);
  assert.match(uploaded, /\n\s+- name: projectIds\b/);
});

test("single editor omits projectIds when serializing registered media", () => {
  const patch = buildMediaEditorialPatch(
    editorValues({ projectIds: ["jestei-event"] }),
    "registered",
  );

  assert.equal(Object.hasOwn(patch, "projectIds"), false);
});

test("single editor keeps projectIds when serializing CMS uploads", () => {
  const patch = buildMediaEditorialPatch(
    editorValues({ projectIds: ["jestei-event"] }),
    "cms",
  );

  assert.deepEqual(patch.projectIds, ["jestei-event"]);
});

test("bulk request applies project edits only to uploaded media", () => {
  const batch = buildBulkMetadataRequest(
    [registeredItem(), uploadedItem()],
    {
      arrays: [
        { field: "projectIds", mode: "set", values: ["jestei-event"] },
        { field: "tags", mode: "set", values: ["edited"] },
      ],
    },
  );

  assert.equal(Object.hasOwn(batch[0].metadata, "projectIds"), false);
  assert.deepEqual(batch[1].metadata.projectIds, ["jestei-event"]);
  assert.deepEqual(batch[0].metadata.tags, ["edited"]);
  assert.deepEqual(batch[1].metadata.tags, ["edited"]);
});

test("registered writer rejects projectIds as a protected field", async () => {
  const { root } = await mediaFixture({ registered: true });
  try {
    await assert.rejects(
      saveMediaDeskMetadata(root, {
        id: REGISTERED_ID,
        metadata: { projectIds: ["jestei-event"] },
      }),
      /projectIds|protected|usage/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uploaded writer resolves runtime cms-prefixed IDs to persisted UUID records", async () => {
  const { root, uploadsDir } = await mediaFixture({ uploaded: true });
  try {
    await saveMediaDeskMetadata(root, {
      id: `cms-${UPLOAD_ID}`,
      metadata: { title: "Edited upload" },
    });

    const saved = JSON.parse(
      await readFile(path.join(uploadsDir, `${UPLOAD_ID}.json`), "utf8"),
    );
    assert.equal(saved.id, UPLOAD_ID);
    assert.equal(saved.title, "Edited upload");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
