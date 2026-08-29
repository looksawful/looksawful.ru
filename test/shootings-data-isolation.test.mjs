import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";

const protectedPresentationFiles = new Map([
  ["index.html", "6ec87a42ce9a5844c6ca4e150ddc27f1ed310415"],
  ["src/main.js", "642cacd7060f09cc5bd757fd33b6eff747620fd7"],
  ["src/styles/index.css", "f5b08fb3743e93747629476480f819cd69d5d3a9"],
  ["src/styles/base.css", "1be5205dcae1522e78ab9cfdc97699875d568f55"],
  ["src/styles/tokens.css", "09b571fe9dcb2ab9485cc610295e8fb134c44c68"],
  ["vite.config.ts", "1fbdd4788730d0b8a6bf700e31ca4c824eb330d9"],
  ["src/data/projects.ts", "c3afd491a0a1060f3ddad078d0d7b686958cf3aa"],
  ["src/templates/project-card.ts", "655fcf61e195a9e06d805f6fb33ed0bed3d9342c"],
  ["src/data/content/jestei-pool.ts", "baa15cc8b278fc87ed0fdba5673bf85e85d37c44"],
  ["src/data/media/entries/sensetique.ts", "1b9c9ee2d04db9a00105c729c1de19941ad7d593"],
]);

const requiredArchiveFiles = [
  "src/data/media/assets/behance-shootings.ts",
  "src/data/media/entries/behance-shootings.ts",
  "src/data/media/assets/berserk-timer.ts",
  "src/data/media/entries/berserk-timer.ts",
  "src/data/media/assets/project-index.ts",
  "src/data/subproject-cards.ts",
  "src/templates/subproject-card.ts",
  "src/styles/subproject-cards.css",
  "src/components/infinite-reel.ts",
  "public/media/projects/shootings/behance/manifest.json",
  "public/media/projects/berserk-timer/cover.webp",
];

function gitBlobSha(path) {
  const content = readFileSync(path);
  const header = Buffer.from(`blob ${content.byteLength}\0`);
  return createHash("sha1").update(header).update(content).digest("hex");
}

function countWebpFiles(path) {
  let count = 0;
  for (const name of readdirSync(path)) {
    const child = `${path}/${name}`;
    if (statSync(child).isDirectory()) count += countWebpFiles(child);
    else if (name.endsWith(".webp")) count += 1;
  }
  return count;
}

test("shootings archive data is available without changing the current presentation contract", () => {
  for (const [path, expectedSha] of protectedPresentationFiles) {
    assert.equal(gitBlobSha(path), expectedSha, `${path} must stay byte-identical to current prod`);
  }

  for (const path of requiredArchiveFiles) {
    assert.ok(existsSync(path), `${path} must be present`);
  }

  assert.equal(
    countWebpFiles("public/media/projects/shootings/behance"),
    80,
    "all 80 imported Behance WebP assets must be present",
  );

  assert.equal(existsSync("shootings/index.html"), false, "the new shootings page must not be deployed yet");

  const projectsSource = readFileSync("src/data/projects.ts", "utf8");
  assert.doesNotMatch(projectsSource, /href:\s*["']\/shootings\//);

  const stylesIndex = readFileSync("src/styles/index.css", "utf8");
  assert.doesNotMatch(stylesIndex, /subproject-cards\.css/);

  const viteSource = readFileSync("vite.config.ts", "utf8");
  assert.doesNotMatch(viteSource, /SHOOTING_CARD_GROUPS|PET_PROJECT_CARDS|shootings:\s*["']shootings\/index\.html/);
});