import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCmsPublicationFiles,
  classifyCmsPublicationPath,
} from "../tools/cms-publication-scope.mjs";

const CMS_CONTENT = "CMS_CONTENT";
const CMS_MEDIA = "CMS_MEDIA";
const CMS_GENERATED = "CMS_GENERATED";
const ENGINEERING = "ENGINEERING";
const UNKNOWN = "UNKNOWN";

const classify = (path) => classifyCmsPublicationPath(path);

test("explicit Pages CMS-owned content paths are publishable", () => {
  for (const path of [
    "src/content/navigation.json",
    "src/content/projects.json",
    "src/content/client-logo-visibility.json",
    "src/content/cv.json",
    "src/content/editorial/cv.json",
    "src/content/editorial/home-project-cards.json",
    "src/content/cases/jestei-pool.json",
    "src/content/cases/styx.json",
    "src/content/cases/sensetique.json",
    "src/content/collections/shootings.json",
    "src/content/shootings/obladaet.json",
    "src/content/standalone-projects/berry-social-content-2020.json",
    "src/content/standalone-projects/awful-cases.json",
    "src/content/media-catalog/registered/jestei-13-source-01-16x9.json",
    "src/content/media-catalog/uploads/74f88a53-7663-4eb4-a1cb-d300f219d8ab.json",
  ]) {
    assert.equal(classify(path), CMS_CONTENT, path);
  }
});

test("CMS media sources are narrowly scoped to configured Pages CMS folders", () => {
  for (const path of [
    "public/media/projects/index/jestei-cover.webp",
    "public/media/catalog/example.webp",
    "public/media/catalog/example.mov",
    "public/media/catalog/example.mp4",
  ]) {
    assert.equal(classify(path), CMS_MEDIA, path);
  }

  for (const path of [
    "public/media/projects/jestei/13/source/example.mp4",
    "public/media/generated/responsive/arbitrary.webp",
    "public/media/catalog/nested/example.webp",
  ]) {
    assert.notEqual(classify(path), CMS_MEDIA, path);
  }
});

test("only exact deterministic generated outputs are CMS-publishable", () => {
  for (const path of [
    "src/data/media/catalog-records.generated.ts",
    "public/media/generated/responsive-manifest.json",
    "public/media/generated/video-inventory.json",
    "src/data/media/responsive-generated.ts",
  ]) {
    assert.equal(classify(path), CMS_GENERATED, path);
  }

  assert.notEqual(classify("public/media/generated/responsive/jestei.webp"), CMS_GENERATED);
  assert.notEqual(classify("src/data/media/another-generated.ts"), CMS_GENERATED);
});

test("known engineering surfaces always block CMS publication", () => {
  for (const path of [
    "src/components/site-nav.ts",
    "src/styles/site-nav.css",
    "src/site/build/site-pages-plugin.ts",
    "src/runtime/example.ts",
    "src/components/composition/entity-intro.ts",
    "src/types/media.ts",
    "src/data/catalog/lookup.ts",
    ".pages.yml",
    ".github/workflows/ci-fast.yml",
    ".agents/skills/looksawful-project-pages/SKILL.md",
    "tools/cms-publication-scope.mjs",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "test/ci-pipeline.test.mjs",
    "tests/example.test.mjs",
    "docs/site-operations.md",
    "AGENTS.md",
    "README.md",
  ]) {
    assert.equal(classify(path), ENGINEERING, path);
  }
});

test("unconfigured content and arbitrary repository paths fail closed as UNKNOWN", () => {
  for (const path of [
    "src/content/experimental-new-system.json",
    "src/content/cases/new-case.json",
    "src/content/standalone-projects/unregistered.json",
    "some-new-directory/file.xyz",
  ]) {
    assert.equal(classify(path), UNKNOWN, path);
  }
});

test("file classification normalizes paths, removes empty/duplicate inputs and sorts deterministically", () => {
  const result = classifyCmsPublicationFiles([
    "",
    "src\\content\\cases\\jestei-pool.json",
    "src/content/cases/jestei-pool.json",
    "  ",
    "public/media/catalog/example.webp",
  ]);

  assert.deepEqual(result.files, [
    { path: "public/media/catalog/example.webp", classification: CMS_MEDIA },
    { path: "src/content/cases/jestei-pool.json", classification: CMS_CONTENT },
  ]);
  assert.deepEqual(result.classifications, [CMS_CONTENT, CMS_MEDIA]);
  assert.equal(result.safe, true);
  assert.deepEqual(result.blocked, []);
});

test("safe CMS content/media/generated combinations are allowed", () => {
  const result = classifyCmsPublicationFiles([
    "src/content/cases/jestei-pool.json",
    "src/content/editorial/cv.json",
    "src/content/editorial/home-project-cards.json",
    "src/content/media-catalog/uploads/74f88a53-7663-4eb4-a1cb-d300f219d8ab.json",
    "public/media/catalog/example.webp",
    "public/media/generated/video-inventory.json",
    "src/data/media/catalog-records.generated.ts",
  ]);

  assert.equal(result.safe, true);
  assert.equal(result.blocked.length, 0);
});

test("mixed CMS and engineering/unknown diffs always block", () => {
  for (const files of [
    ["src/content/cases/jestei-pool.json", "src/components/site-nav.ts"],
    ["public/media/catalog/example.webp", "src/styles/site-nav.css"],
    ["public/media/generated/video-inventory.json", "package.json"],
    ["src/content/cv.json", "some-new-directory/file.xyz"],
  ]) {
    const result = classifyCmsPublicationFiles(files);
    assert.equal(result.safe, false, files.join(", "));
    assert.ok(result.blocked.some(({ classification }) => classification === ENGINEERING || classification === UNKNOWN));
  }
});

test("empty change list is a safe classifier no-op; branch topology decides whether publication is needed", () => {
  const result = classifyCmsPublicationFiles([]);
  assert.equal(result.safe, true);
  assert.deepEqual(result.files, []);
  assert.deepEqual(result.classifications, []);
  assert.deepEqual(result.blocked, []);
});