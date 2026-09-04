import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMediaEditorialPatch,
  applyRegisteredMediaEditorialPatch,
  collectContentDeskTextEntries,
} from "../src/tools/media-desk/editor-model.ts";

test("media desk editorial patch preserves technical metadata and rejects protected fields", () => {
  const record = {
    id: "asset-a",
    src: "/media/a.webp",
    width: 1200,
    title: "Old title",
    alt: "Old alt",
    archived: false,
  };

  const next = applyMediaEditorialPatch(record, {
    title: "New title",
    alt: "New alt",
    archived: true,
  });

  assert.equal(next.title, "New title");
  assert.equal(next.alt, "New alt");
  assert.equal(next.archived, true);
  assert.equal(next.src, record.src);
  assert.equal(next.width, record.width);
  assert.throws(
    () => applyMediaEditorialPatch(record, { src: "/media/changed.webp" }),
    /protected field/i,
  );
});

test("registered Media Desk metadata cannot write asset-level project membership", () => {
  const record = {
    id: "asset-a",
    title: "Old title",
    alt: "",
    description: "",
    date: "2026",
    workAreaIds: ["photography"],
    projectTypeIds: ["shooting"],
    deliverableIds: [],
    tags: [],
    credits: [],
    reusable: true,
    archived: false,
  };

  assert.throws(
    () => applyRegisteredMediaEditorialPatch(record, { projectIds: ["project-a"] }),
    /projectIds|usage|protected/i,
  );

  const next = applyRegisteredMediaEditorialPatch(record, {
    title: "New title",
    tags: ["фото"],
    reusable: false,
  });
  assert.equal(next.title, "New title");
  assert.deepEqual(next.tags, ["фото"]);
  assert.equal(next.reusable, false);
});

test("content desk text index keeps authored copy and excludes structural values", () => {
  const entries = collectContentDeskTextEntries({
    "../../content/cases/demo.json": {
      id: "demo",
      title: "Visible title",
      sections: [
        {
          id: "intro",
          heading: "Intro heading",
          body: "Body copy",
          projectIds: ["project-a"],
          href: "/work/demo/",
        },
      ],
      tags: ["internal-tag"],
    },
  });

  assert.deepEqual(
    entries.map(({ sourcePath, fieldPath, value }) => ({ sourcePath, fieldPath, value })),
    [
      {
        sourcePath: "src/content/cases/demo.json",
        fieldPath: "sections.0.body",
        value: "Body copy",
      },
      {
        sourcePath: "src/content/cases/demo.json",
        fieldPath: "sections.0.heading",
        value: "Intro heading",
      },
      {
        sourcePath: "src/content/cases/demo.json",
        fieldPath: "title",
        value: "Visible title",
      },
    ],
  );
});
