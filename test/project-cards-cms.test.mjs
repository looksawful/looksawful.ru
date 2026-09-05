import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { renderPortfolioEntityCard as renderProjectCard } from "../src/components/composition/index.ts";
import {
  projectIndexMediaAssetFor,
  projectIndexMediaAssets,
} from "../src/data/media/assets/project-index.ts";
import {
  parseProjectCardPresentations,
  projectCardPresentations,
} from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";

const cmsConfig = readFileSync(new URL("../.pages.yml", import.meta.url), "utf8");
const structure = JSON.parse(readFileSync(new URL("../src/content/projects.json", import.meta.url), "utf8"));
const copy = JSON.parse(readFileSync(new URL("../src/content/editorial/home-project-cards.json", import.meta.url), "utf8"));
const publishWorkflow = readFileSync(new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url), "utf8");
const mediaWorkflow = readFileSync(new URL("../.github/workflows/cms-media.yml", import.meta.url), "utf8");

const projectCardIds = ["jestei", "styx", "sensetique", "shootings"];

test("ProjectCardPresentation composes fixed identity/media structure with authored copy", () => {
  assert.deepEqual(projectCardPresentations.map(({ id }) => id), projectCardIds);
  assert.equal(projectCardPresentations.length, structure.length);

  for (const card of projectCardPresentations) {
    const state = structure.find(({ id }) => id === card.id);
    assert.ok(state);
    assert.equal(card.visible, state.visible);
    assert.equal(card.cover.src, state.cover.src);
    assert.equal(card.cover.width, state.cover.width);
    assert.equal(card.cover.height, state.cover.height);
    assert.equal(card.focus, copy[card.id].focus);
    assert.equal(card.cover.alt, copy[card.id].coverAlt);
    assert.ok(renderProjectCard(card).includes(`href="${getProjectCardHref(card)}"`));
  }
});

test("project-card structural source contains no authored copy", () => {
  for (const card of structure) {
    assert.deepEqual(Object.keys(card).sort(), ["cover", "id", "visible"]);
    assert.deepEqual(Object.keys(card.cover).sort(), ["height", "src", "width"]);
  }
});

test("project-card editorial source contains no IDs, visibility or media references", () => {
  assert.deepEqual(Object.keys(copy).sort(), [...projectCardIds].sort());
  for (const [id, authored] of Object.entries(copy)) {
    assert.equal("id" in authored, false, id);
    assert.equal("visible" in authored, false, id);
    assert.equal("src" in authored, false, id);
    assert.equal("cover" in authored, false, id);
    for (const key of Object.keys(authored)) {
      assert.ok(["title", "focus", "role", "period", "ariaLabel", "coverAlt"].includes(key), `${id}.${key}`);
    }
  }
});

test("ProjectCardPresentation keeps code-owned order while authored overrides remain editable", () => {
  const reordered = structuredClone(structure).reverse();
  const editedCopy = structuredClone(copy);
  editedCopy.jestei.title = "Тизерное название";
  editedCopy.jestei.role = "Тизерная роль";
  editedCopy.jestei.period = "Тизерный период";
  editedCopy.jestei.focus = "Тизерное описание";

  const parsed = parseProjectCardPresentations(reordered, editedCopy);
  assert.deepEqual(parsed.map(({ id }) => id), projectCardIds);
  assert.equal(parsed[0].title, editedCopy.jestei.title);
  assert.equal(parsed[0].role, editedCopy.jestei.role);
  assert.equal(parsed[0].period, editedCopy.jestei.period);
  assert.equal(parsed[0].focus, editedCopy.jestei.focus);
});

test("CMS project covers stay in the scoped WebP folder and metadata matches real files", async () => {
  for (const card of projectCardPresentations) {
    assert.match(card.cover.src, /^\/media\/projects\/index\/[a-z0-9][a-z0-9-]*\.webp$/);
    const filePath = fileURLToPath(new URL(`../public${card.cover.src}`, import.meta.url));
    const metadata = await sharp(filePath).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, card.cover.width);
    assert.equal(metadata.height, card.cover.height);
  }
});

test("project covers are derived into the typed media registry", () => {
  assert.equal(projectIndexMediaAssets.length, projectCardPresentations.length);
  for (const card of projectCardPresentations) {
    const asset = projectIndexMediaAssetFor(card);
    assert.equal(asset.type, "image");
    assert.equal(asset.src, card.cover.src);
    assert.equal(asset.width, card.cover.width);
    assert.equal(asset.height, card.cover.height);
  }
});

test("homepage project cards consume registry-backed responsive cover variants without stale reuse", () => {
  const html = renderProjectCard(projectCardPresentations[0]);
  assert.match(html, /\ssrcset="[^"]+"/);
  assert.match(html, /\ssizes="[^"]+"/);
  assert.match(html, /\/media\/generated\/responsive\/projects\/index\/jestei-pool-cover@/);

  const uploadedCover = {
    ...projectCardPresentations[0],
    cover: { ...projectCardPresentations[0].cover, src: "/media/projects/index/cms-uploaded-cover.webp" },
  };
  assert.doesNotMatch(renderProjectCard(uploadedCover), /jestei-pool-cover@/);
});

test("Pages CMS exposes project copy separately from structural/media state", () => {
  const copyConfig = cmsConfig.match(/\n  - name: project-cards\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";
  assert.match(copyConfig, /path: src\/content\/editorial\/home-project-cards\.json/);
  assert.doesNotMatch(copyConfig, /- name: (id|visible|src|width|height|cover|route|pageId)\b/);

  const structureConfig = cmsConfig.match(/\n  - name: project-card-media\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";
  assert.match(structureConfig, /path: src\/content\/projects\.json/);
  assert.match(structureConfig, /- name: id[\s\S]*?readonly: true/);
  assert.match(structureConfig, /- name: cover\b/);
  assert.match(structureConfig, /media: project-covers/);
});

test("Pages CMS uses scoped WebP media source and merge-safe saves", () => {
  assert.match(cmsConfig, /settings:\s*\n\s+content:\s*\n\s+merge: true/);
  assert.match(cmsConfig, /media:\s*\n\s+- name: project-covers/);
  assert.match(cmsConfig, /input: public\/media\/projects\/index/);
  assert.match(cmsConfig, /output: \/media\/projects\/index/);
  assert.match(cmsConfig, /extensions: \[webp\]/);
});

test("publication action keeps trusted prod policy and only prepares a dev to prod PR", () => {
  const action = cmsConfig.match(/actions:\s*\n\s+- name: prepare-publication[\s\S]*?(?=\ncontent:)/)?.[0] ?? "";
  assert.match(action, /workflow: pages-cms-publish\.yml/);
  assert.match(action, /ref: prod\b/);
  assert.match(publishWorkflow, /source_ref.*!=.*dev/s);
  assert.match(publishWorkflow, /WORKFLOW_REF.*!=.*prod/s);
  assert.match(publishWorkflow, /cms-publication-topology\.mjs/);
  assert.match(publishWorkflow, /cms-publication-scope\.mjs/);
  assert.match(publishWorkflow, /gh pr list/);
  assert.match(publishWorkflow, /gh pr create/);
  assert.doesNotMatch(publishWorkflow, /gh pr checks/);
  assert.doesNotMatch(publishWorkflow, /EXPECTED_DEV_SHA|headRefOid/);
  assert.doesNotMatch(publishWorkflow, /pulls\/\$\{PR_NUMBER\}\/merge/);
  assert.doesNotMatch(publishWorkflow, /actions\/deploy-pages|git push[^\n]*prod/);
});

test("CMS media workflow owns project-cover mutation and normalized metadata through an allowlist", () => {
  assert.match(mediaWorkflow, /permissions:\s*\n\s+contents: write/);
  assert.match(mediaWorkflow, /src\/content\/projects\.json/);
  assert.match(mediaWorkflow, /public\/media\/projects\/index\/\*\*/);
  assert.match(mediaWorkflow, /src\/data\/media\/catalog-records\.generated\.ts/);
  assert.match(mediaWorkflow, /public\/media\/generated\/responsive-manifest\.json/);
  assert.match(mediaWorkflow, /public\/media\/generated\/video-inventory\.json/);
  assert.match(mediaWorkflow, /src\/data\/media\/responsive-generated\.ts/);
  assert.match(mediaWorkflow, /CMS media attempted unexpected tracked mutation/);
  assert.match(mediaWorkflow, /git push origin HEAD:dev/);
  assert.doesNotMatch(mediaWorkflow, /git add -A/);
});