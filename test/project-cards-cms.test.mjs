import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  projectIndexMediaAssetFor,
  projectIndexMediaAssets,
} from "../src/data/media/assets/project-index.ts";
import {
  parseProjectCardPresentations,
  projectCardPresentations,
} from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";
import { renderProjectCard } from "../src/templates/project-card.ts";

const cmsConfig = readFileSync(new URL("../.pages.yml", import.meta.url), "utf8");
const sourceCards = JSON.parse(readFileSync(new URL("../src/content/projects.json", import.meta.url), "utf8"));
const publishWorkflow = readFileSync(
  new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url),
  "utf8",
);
const verifyDevWorkflow = readFileSync(
  new URL("../.github/workflows/sync-cms-media-metadata.yml", import.meta.url),
  "utf8",
);

const baselineCards = [
  {
    id: "jestei",
    pageId: "case:jestei-pool",
    title: "Jestei Pool",
    focus: "Музыкальный сервис для диджеев",
    role: "Арт-директор",
    period: "2024–2026",
    cover: {
      src: "/media/projects/index/jestei-pool-cover.webp",
      alt: "Коллаж с ноутбуками, планшетами и мобильными устройствами с интерфейсами сервиса Jestei Pool на экранах",
      width: 1580,
      height: 1360,
    },
  },
  {
    id: "styx",
    pageId: "case:styx",
    title: "Styx Jewel",
    focus: "Готический бренд ювелирных изделий и одежды",
    role: "Дизайнер",
    period: "2021–2025",
    cover: {
      src: "/media/projects/index/styx-jewel-cover.webp",
      alt: "Два мобильных устройства с логотипом Styx Jewel и интерфейсом интернет магазина бренда на экранах",
      width: 1580,
      height: 1360,
    },
  },
  {
    id: "sensetique",
    pageId: "case:sensetique",
    title: "Sensetique",
    focus: "Продакшен агентство полного цикла в индустрии моды и искусства и коммерческая фотостудия",
    role: "Основатель",
    period: "2016–2018",
    cover: {
      src: "/media/projects/index/sensetique-cover.webp",
      alt: "Коллаж с фотографиями продакшена Sensetique и интерьерами залов фотостудии",
      width: 1580,
      height: 1360,
    },
  },
  {
    id: "shootings",
    pageId: "collection:music-photography",
    title: "Shootings",
    focus: "Фотографии и микс-медиа арт для музыкантов, выставок и брендов",
    role: "Фотограф",
    period: "2016–2025",
    cover: {
      src: "/media/projects/index/shootings-cover.webp",
      alt: "Печатный разворот с фотографией Evasha",
      width: 1580,
      height: 1360,
    },
  },
];

const projectCardIds = baselineCards.map(({ id }) => id);

test("ProjectCardPresentation preserves the existing rendered card contract", () => {
  const baselineHtml = baselineCards.map(renderProjectCard).join("\n");
  const liveHtml = projectCardPresentations.map(renderProjectCard).join("\n");

  assert.equal((baselineHtml.match(/class="project-card"/g) ?? []).length, baselineCards.length);
  assert.equal(liveHtml, baselineHtml);
  for (const card of baselineCards) {
    assert.ok(baselineHtml.includes(`href="${getProjectCardHref(card)}"`));
  }
});

test("ProjectCardPresentation derives canonical title, role and normal Case period instead of storing redundant CMS copies", () => {
  assert.deepEqual(projectCardPresentations.map(({ id }) => id), projectCardIds);
  assert.deepEqual(
    projectCardPresentations.map(({ title, role, period }) => ({ title, role, period })),
    baselineCards.map(({ title, role, period }) => ({ title, role, period })),
  );

  for (const source of sourceCards.slice(0, 3)) {
    assert.equal("title" in source, false, `${source.id} title must derive from its canonical entity`);
    assert.equal("role" in source, false, `${source.id} role must derive from its canonical entity`);
    assert.equal("period" in source, false, `${source.id} period must derive from its canonical Case chronology`);
  }
  assert.equal("title" in sourceCards[3], false, "Shootings title must derive from its canonical Collection");
  assert.equal("role" in sourceCards[3], false, "Shootings role must derive from its canonical Collection");
  assert.equal(sourceCards[3].period, "2016–2025", "Shootings keeps its presentation-specific period override");
});

test("ProjectCardPresentation keeps fixed code-owned identity/order while CMS copy and explicit teaser overrides remain editable", () => {
  const reordered = structuredClone(sourceCards).reverse();
  const normalized = parseProjectCardPresentations(reordered);
  assert.deepEqual(normalized.map(({ id }) => id), projectCardIds);

  const edited = structuredClone(sourceCards);
  edited[0].title = "Тизерное название";
  edited[0].role = "Тизерная роль";
  edited[0].period = "Тизерный период";
  edited[0].focus = "Тизерное описание";
  const parsed = parseProjectCardPresentations(edited);
  assert.equal(parsed[0].title, edited[0].title);
  assert.equal(parsed[0].role, edited[0].role);
  assert.equal(parsed[0].period, edited[0].period);
  assert.equal(parsed[0].focus, edited[0].focus);
});

test("CMS project covers stay in the scoped WebP folder and metadata matches the real files", async () => {
  for (const card of projectCardPresentations) {
    assert.match(
      card.cover.src,
      /^\/media\/projects\/index\/[a-z0-9][a-z0-9-]*\.webp$/,
      `${card.id} cover must use the CMS project-cover path`,
    );

    const filePath = fileURLToPath(new URL(`../public${card.cover.src}`, import.meta.url));
    const metadata = await sharp(filePath).metadata();

    assert.equal(metadata.format, "webp", `${card.id} cover must be WebP`);
    assert.equal(metadata.width, card.cover.width, `${card.id} cover width metadata is stale`);
    assert.equal(metadata.height, card.cover.height, `${card.id} cover height metadata is stale`);
  }
});

test("CMS project covers are derived into the typed media registry", () => {
  assert.equal(projectIndexMediaAssets.length, projectCardPresentations.length);

  for (const card of projectCardPresentations) {
    const asset = projectIndexMediaAssetFor(card);
    assert.deepEqual(
      projectIndexMediaAssets.find(({ id }) => id === asset.id),
      asset,
      `${card.id} cover must be present in the live registry`,
    );
    assert.equal(asset.type, "image");
    assert.equal(asset.src, card.cover.src);
    assert.equal(asset.width, card.cover.width);
    assert.equal(asset.height, card.cover.height);
  }

  const uploadedCover = {
    ...projectCardPresentations[0],
    cover: {
      ...projectCardPresentations[0].cover,
      src: "/media/projects/index/cms-uploaded-cover.webp",
      width: 2048,
      height: 1152,
    },
  };
  const uploadedAsset = projectIndexMediaAssetFor(uploadedCover);

  assert.equal(uploadedAsset.src, uploadedCover.cover.src);
  assert.equal(uploadedAsset.width, uploadedCover.cover.width);
  assert.equal(uploadedAsset.height, uploadedCover.cover.height);
});

test("homepage project cards consume registry-backed responsive cover variants", () => {
  const html = renderProjectCard(projectCardPresentations[0]);

  assert.match(html, /\ssrcset="[^"]+"/);
  assert.match(html, /\ssizes="[^"]+"/);
  assert.match(html, /\/media\/generated\/responsive\/projects\/index\/jestei-pool-cover@/);

  const uploadedCover = {
    ...projectCardPresentations[0],
    cover: {
      ...projectCardPresentations[0].cover,
      src: "/media/projects/index/cms-uploaded-cover.webp",
    },
  };
  const unsyncedHtml = renderProjectCard(uploadedCover);

  assert.doesNotMatch(
    unsyncedHtml,
    /jestei-pool-cover@/,
    "a newly selected cover must never reuse stale derivatives from the prior file",
  );
});

test("Pages CMS keeps project-card identity and destructive operations locked", () => {
  const projectCardsConfig = cmsConfig.match(/\n  - name: project-cards\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";

  assert.match(projectCardsConfig, /operations:\s*\n\s+create: false\s*\n\s+rename: false\s*\n\s+delete: false/);
  assert.match(projectCardsConfig, /- name: id\s*\n\s+label: ID\s*\n\s+type: string\s*\n\s+required: true\s*\n\s+readonly: true/);
});

test("Pages CMS preserves unknown structured keys when saving", () => {
  assert.match(cmsConfig, /settings:\s*\n\s+content:\s*\n\s+merge: true/);
});

test("Pages CMS uses a scoped WebP media source for project covers", () => {
  assert.match(cmsConfig, /media:\s*\n\s+- name: project-covers/);
  assert.match(cmsConfig, /input: public\/media\/projects\/index/);
  assert.match(cmsConfig, /output: \/media\/projects\/index/);
  assert.match(cmsConfig, /extensions: \[webp\]/);
  assert.match(cmsConfig, /- name: src\s*\n\s+label: Обложка проекта\s*\n\s+type: image/);
  assert.match(cmsConfig, /media: project-covers/);
});

test("Pages CMS exposes a clear verification action and no routing fields", () => {
  const projectCardsConfig = cmsConfig.match(/\n  - name: project-cards\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";

  assert.match(projectCardsConfig, /label: Проверить сайт/);
  assert.match(projectCardsConfig, /confirm:\s*\n\s+title: Запустить полную проверку сайта\?/);
  assert.doesNotMatch(projectCardsConfig, /- name: (route|canonical|listed|indexable|slug|pageType|pageId)\b/);
});

test("Pages CMS publication action can only prepare dev to prod PRs", () => {
  assert.match(cmsConfig, /name: prepare-publication/);
  assert.match(cmsConfig, /label: Подготовить публикацию/);
  assert.match(cmsConfig, /workflow: pages-cms-publish\.yml/);
  assert.match(publishWorkflow, /source_ref.*!=.*dev/s);
  assert.match(publishWorkflow, /WORKFLOW_REF.*!=.*dev/s);
  assert.match(publishWorkflow, /compare\/prod\.\.\.dev/);
  assert.match(publishWorkflow, /--base prod/);
  assert.match(publishWorkflow, /--head dev/);
  assert.doesNotMatch(publishWorkflow, /gh pr merge|enable.*auto.?merge|merge_pull_request/i);
});

test("explicit CMS mutation safely persists deterministic metadata for project covers and media catalog uploads", () => {
  assert.match(verifyDevWorkflow, /permissions:\s*\n\s+contents: write/);
  assert.match(verifyDevWorkflow, /name: Persist synchronized CMS media metadata/);
  assert.match(verifyDevWorkflow, /src\/content\/projects\.json/);
  assert.match(verifyDevWorkflow, /public\/media\/projects\/index\/\*/);
  assert.match(verifyDevWorkflow, /src\/content\/media-catalog\/uploads\/\*\.json/);
  assert.match(verifyDevWorkflow, /public\/media\/catalog\/\*/);
  assert.match(verifyDevWorkflow, /src\/data\/media\/catalog-records\.generated\.ts/);
  assert.match(verifyDevWorkflow, /public\/media\/generated\/responsive-manifest\.json/);
  assert.match(verifyDevWorkflow, /public\/media\/generated\/video-inventory\.json/);
  assert.match(verifyDevWorkflow, /src\/data\/media\/responsive-generated\.ts/);
  assert.match(verifyDevWorkflow, /git push origin HEAD:dev/);
  assert.match(verifyDevWorkflow, /Refusing to persist generated metadata/);
});
