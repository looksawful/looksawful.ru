import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";

import { behanceShootingMediaAssets } from "../src/data/media/assets/behance-shootings.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

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

function countWebpFiles(path) {
  let count = 0;
  for (const name of readdirSync(path)) {
    const child = `${path}/${name}`;
    if (statSync(child).isDirectory()) count += countWebpFiles(child);
    else if (name.endsWith(".webp")) count += 1;
  }
  return count;
}

test("shootings archive data stays isolated while the Collection route remains deployable", () => {
  for (const path of requiredArchiveFiles) {
    assert.ok(existsSync(path), `${path} must be present`);
  }

  for (const asset of behanceShootingMediaAssets) {
    assert.ok(
      existsSync(`public${asset.src}`),
      `registered Behance asset must have a physical file: ${asset.id} -> ${asset.src}`,
    );
  }
  assert.equal(
    countWebpFiles("public/media/projects/shootings/behance"),
    behanceShootingMediaAssets.length,
    "Behance archive must contain exactly the registered deduped WebP assets",
  );

  assert.equal(existsSync("shootings/index.html"), true, "the Collection route must have a physical Vite input");
  const shootingsPage = sitePages.find((page) => page.id === "collection:music-photography");
  assert.ok(shootingsPage);
  assert.equal(shootingsPage.type, "collection");
  assert.equal(shootingsPage.path, "/shootings/");

  const indexSource = readFileSync("index.html", "utf8");
  assert.match(indexSource, /id="project-shootings"/);
  assert.doesNotMatch(indexSource, /<!-- SHOOTINGS_INTRO -->/);
  assert.doesNotMatch(indexSource, /\/media\/projects\/shootings\/behance\//);

  const projectsSource = readFileSync("src/data/projects.ts", "utf8");
  assert.doesNotMatch(projectsSource, /href:\s*["']\/shootings\//);
  assert.match(
    projectsSource,
    /\{\s*id:\s*["']shootings["'],\s*pageId:\s*["']collection:music-photography["']\s*\}/,
  );

  const cardSource = readFileSync("src/templates/project-card.ts", "utf8");
  assert.match(cardSource, /getProjectCardHref\(card\)/);
  assert.doesNotMatch(cardSource, /const href = `#project-\$\{card\.id\}`/);

  const mainSource = readFileSync("src/main.js", "utf8");
  assert.doesNotMatch(mainSource, /^import\s+["']\.\/components\/(?:awful-cases-game|animated-canvas-gallery)\.js["'];/m);
  assert.match(mainSource, /import\(["']\.\/components\/awful-cases-game\.js["']\)/);
  assert.match(mainSource, /import\(["']\.\/components\/animated-canvas-gallery\.js["']\)/);

  const stylesIndex = readFileSync("src/styles/index.css", "utf8");
  assert.doesNotMatch(stylesIndex, /subproject-cards\.css/);

  const viteSource = readFileSync("vite.config.ts", "utf8");
  assert.match(viteSource, /createSiteInputs/);
  assert.match(viteSource, /createSitePagesPlugin/);
  assert.doesNotMatch(viteSource, /SHOOTING_CARD_GROUPS|PET_PROJECT_CARDS/);
});
