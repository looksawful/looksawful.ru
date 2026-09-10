import assert from "node:assert/strict";
import test from "node:test";

import {
  mediaCandidatePaths,
  parseRepositoryName,
  utf8ToBase64,
} from "../tools/cloudflare/media-desk/github.mjs";

test("Cloudflare Media Desk maps catalog ids to safe candidate paths", () => {
  assert.deepEqual(mediaCandidatePaths("hero-shot"), [
    "src/content/media-catalog/registered/hero-shot.json",
    "src/content/media-catalog/uploads/hero-shot.json",
  ]);
  assert.deepEqual(mediaCandidatePaths("cms-upload-1"), [
    "src/content/media-catalog/registered/cms-upload-1.json",
    "src/content/media-catalog/uploads/upload-1.json",
  ]);
  assert.throws(() => mediaCandidatePaths("../oops"), /invalid/);
});

test("Cloudflare Media Desk validates repository owner/name", () => {
  assert.deepEqual(parseRepositoryName("looksawful/looksawful.ru"), {
    owner: "looksawful",
    name: "looksawful.ru",
  });
  assert.throws(() => parseRepositoryName("looksawful"), /owner\/name/);
});

test("Cloudflare Media Desk base64 encodes UTF-8 content", () => {
  assert.equal(utf8ToBase64("Привет\n"), "0J/RgNC40LLQtdGCCg==");
});
