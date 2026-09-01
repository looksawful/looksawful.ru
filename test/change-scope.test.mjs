import assert from "node:assert/strict";
import test from "node:test";
import { classifyChangedFiles } from "../tools/ci/change-scope.mjs";

test("CV copy stays focused and never requests media transcoding", () => {
  const scope = classifyChangedFiles(["src/content/cv.json", "public/cv/index.html"]);
  assert.equal(scope.mediaChanged, false);
  assert.deepEqual(scope.suites, ["smoke", "cv"]);
});
test("navigation and standalone projects select their actual browser suites", () => {
  assert.deepEqual(classifyChangedFiles(["src/content/navigation.json"]).suites, ["smoke", "navigation"]);
  assert.deepEqual(classifyChangedFiles(["src/content/berry.json"]).suites, ["smoke", "project-pages"]);
});
test("media changes always validate real derivatives and browser media", () => {
  for (const file of ["public/media/catalog/new.webp", "src/content/projects.json", "src/data/media/assets/styx.ts", "tools/build-video-media.mjs", "package-lock.json"]) {
    const scope = classifyChangedFiles([file]);
    assert.equal(scope.mediaChanged, true, file);
    assert.ok(scope.suites.includes("media") || scope.suites.includes("full"), file);
  }
});
test("global infrastructure and unknown paths fail closed to full regression", () => {
  for (const file of ["src/main.ts", "vite.config.ts", "src/styles/base.css", "src/components/media-lightbox.ts", "unclassified/new-module.ts"]) {
    assert.deepEqual(classifyChangedFiles([file]).suites, ["full"], file);
  }
  assert.deepEqual(classifyChangedFiles([]).suites, ["full"]);
  assert.equal(classifyChangedFiles([]).mediaChanged, true);
});
test("docs and CV-specific styles do not select exhaustive media regression", () => {
  assert.deepEqual(classifyChangedFiles(["docs/tooling-pipeline.md"]).suites, ["smoke"]);
  assert.deepEqual(classifyChangedFiles(["public/cv/style.css"]).suites, ["smoke", "cv"]);
});
test("domain catalog migration guard stays in affected content scope", () => {
  const scope = classifyChangedFiles(["test/domain-catalog-identity.test.mjs"]);
  assert.equal(scope.scope, "affected");
  assert.equal(scope.mediaChanged, false);
  assert.deepEqual(scope.groups, ["content"]);
  assert.deepEqual(scope.suites, ["smoke", "mpa"]);
});
