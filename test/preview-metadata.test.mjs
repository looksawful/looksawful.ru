import assert from "node:assert/strict";
import test from "node:test";

async function loadMetadataModule() {
  try {
    return await import("../tools/preview/preview-metadata.mjs");
  } catch (error) {
    assert.fail(`preview metadata module must be importable: ${error.message}`);
  }
}

const validBase = {
  repository: "looksawful/looksawful.ru",
  sha: "A".repeat(40),
  kind: "feature",
  key: "pr-801",
  pr: 801,
};

test("preview metadata accepts the four supported kinds and normalizes SHA", async () => {
  const { parsePreviewMetadata } = await loadMetadataModule();

  for (const kind of ["feature", "lab", "cms", "release"]) {
    const result = parsePreviewMetadata({ ...validBase, kind });
    assert.deepEqual(result, {
      ...validBase,
      sha: validBase.sha.toLowerCase(),
      kind,
    });
  }
});

test("preview metadata rejects malformed identity fields", async () => {
  const { parsePreviewMetadata } = await loadMetadataModule();

  const invalidValues = [
    [{ ...validBase, repository: "looksawful" }, /repository/i],
    [{ ...validBase, sha: "abc" }, /sha/i],
    [{ ...validBase, sha: "g".repeat(40) }, /sha/i],
    [{ ...validBase, kind: "production" }, /kind/i],
    [{ ...validBase, key: "../escape" }, /key/i],
    [{ ...validBase, key: "UPPER" }, /key/i],
    [{ ...validBase, key: "a".repeat(64) }, /key/i],
    [{ ...validBase, pr: 0 }, /pr/i],
    [{ ...validBase, pr: 1.5 }, /pr/i],
  ];

  for (const [value, expected] of invalidValues) {
    assert.throws(() => parsePreviewMetadata(value), expected);
  }
});

test("preview metadata permits an omitted PR but rejects unknown fields", async () => {
  const { parsePreviewMetadata } = await loadMetadataModule();

  const { pr: _pr, ...withoutPr } = validBase;
  assert.deepEqual(parsePreviewMetadata(withoutPr), {
    ...withoutPr,
    sha: withoutPr.sha.toLowerCase(),
  });

  assert.throws(
    () => parsePreviewMetadata({ ...validBase, password: "must-never-travel-with-metadata" }),
    /unknown.*password/i,
  );
});

test("preview metadata accepts JSON text and rejects non-object JSON", async () => {
  const { parsePreviewMetadata } = await loadMetadataModule();

  assert.equal(parsePreviewMetadata(JSON.stringify(validBase)).key, "pr-801");
  assert.throws(() => parsePreviewMetadata("[]"), /object/i);
  assert.throws(() => parsePreviewMetadata("null"), /object/i);
  assert.throws(() => parsePreviewMetadata("not-json"), /json/i);
});
