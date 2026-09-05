import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const step = (workflow, name) => workflow.match(new RegExp(`\\n      - name: ${name}\\b[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";

test("CMS media routes ordinary image replacement through affected-only normalization", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");

  for (const path of [
    "src/content/projects.json",
    "src/content/media-catalog/registered/**",
    "src/content/media-catalog/uploads/**",
  ]) assert.ok(workflow.includes(path), `missing media-aware trigger: ${path}`);

  for (const output of ["has_image_source", "has_video_source", "has_media_reference_or_metadata"]) {
    assert.ok(workflow.includes(output), `missing classifier output: ${output}`);
  }
  assert.match(workflow, /src\/content\/projects\.json\|src\/content\/media-catalog\/registered\/\*\|src\/content\/media-catalog\/uploads\/\*/);
  assert.match(workflow, /has_media_reference_or_metadata=true/);

  const affected = step(workflow, "Resolve affected media assets");
  assert.match(affected, /affected-media\.mjs/);
  assert.match(affected, /--github-output/);

  const previous = step(workflow, "Restore exact previous generated media cache when available");
  assert.match(previous, /has_media_change == 'true'/);
  assert.match(previous, /steps\.previous-media\.outputs\.fingerprint/);

  const broadNoVideoCache = step(workflow, "Require exact base cache for broad non-video media mutation");
  assert.match(broadNoVideoCache, /has_media_change == 'true'/);
  assert.match(broadNoVideoCache, /image_only != 'true'/);
  assert.match(broadNoVideoCache, /has_video != 'true'/);
  assert.doesNotMatch(broadNoVideoCache, /image-only/i);

  const videoTooling = step(workflow, "Install video tooling");
  assert.match(videoTooling, /has_video == 'true'/);
  assert.doesNotMatch(videoTooling, /has_media_reference_or_metadata/);
  assert.match(videoTooling, /ffmpeg/);

  const videoBuild = step(workflow, "Build video derivatives incrementally");
  assert.match(videoBuild, /has_video == 'true'/);

  const broadImageBuild = step(workflow, "Build broad image derivatives incrementally");
  assert.match(broadImageBuild, /image_only != 'true'/);
  assert.match(broadImageBuild, /has_image == 'true'/);

  const affectedImageBuild = step(workflow, "Build affected image derivatives only");
  assert.match(affectedImageBuild, /image_only == 'true'/);
  assert.match(affectedImageBuild, /--asset-id/);
  assert.match(affectedImageBuild, /build-responsive-media\.mjs/);
  assert.doesNotMatch(affectedImageBuild, /ffmpeg|media:sync|media:video/i);

  assert.match(workflow, /npm run media:catalog:sync/);
  assert.match(workflow, /npm run test:media:contract/);
  assert.match(workflow, /npm run test:media:checks/);
  assert.match(workflow, /npm run media:catalog:check/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-write/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --fingerprint/);
  assert.match(workflow, /node tools\/media-dev-state\.mjs --cache-verify/);
  assert.match(workflow, /actions\/cache\/save@v6/);

  const sourceFast = step(workflow, "Final Fast validation for broad source mutation");
  assert.match(sourceFast, /image_only != 'true'/);
  assert.match(sourceFast, /has_image == 'true'.*has_video == 'true'.*rebuild == 'true'/s);
  assert.match(sourceFast, /npm run typecheck/);
  assert.match(sourceFast, /npm run test:fast/);
  assert.match(sourceFast, /npm run build:site/);
  assert.doesNotMatch(workflow, /playwright|test:e2e/i);
});

test("media metadata cannot result in zero Actions while Fast CI keeps it off the engineering path", async () => {
  const media = await read(".github/workflows/cms-media.yml");
  const fast = await read(".github/workflows/ci-fast.yml");
  for (const path of [
    "src/content/media-catalog/registered/**",
    "src/content/media-catalog/uploads/**",
  ]) {
    assert.ok(media.includes(path), `CMS media must listen to ${path}`);
    assert.ok(fast.includes(path), `Fast CI may keep ignoring ${path} only because CMS media owns it`);
  }
});

test("canonical media fingerprint owns sync-media-catalog tooling bytes", async () => {
  const source = await read("tools/media-dev-state.mjs");
  const configBlock = source.match(/const DEFAULT_CONFIG_FILES = \[[\s\S]*?\];/)?.[0] ?? "";
  assert.match(configBlock, /tools\/sync-media-catalog\.mjs/);
  assert.match(source, /createHash\("sha256"\)/);
  assert.doesNotMatch(source, /Date\.now\(|Math\.random\(|mtimeMs.*config|git rev-parse|GITHUB_SHA/);
});
