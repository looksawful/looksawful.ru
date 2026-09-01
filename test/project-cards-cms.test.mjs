import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  projectIndexMediaAssetFor,
  projectIndexMediaAssets,
} from "../src/data/media/assets/project-index.ts";
import { projects } from "../src/data/projects.ts";
import { getProjectCardHref } from "../src/site/pages/project-card-routes.ts";
import { renderProjectCard } from "../src/templates/project-card.ts";

const cmsConfig = readFileSync(new URL("../.pages.yml", import.meta.url), "utf8");
const publishWorkflow = readFileSync(
  new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url),
  "utf8",
);
const verifyDevWorkflow = readFileSync(
  new URL("../.github/workflows/sync-cms-media-metadata.yml", import.meta.url),
  "utf8",
);

const baselineProjects = [
  {
    id: "jestei",
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

const projectIds = baselineProjects.map(({ id }) => id);

test("CMS project-card migration fixture preserves the original rendering contract without freezing live copy", () => {
  const baselineHtml = baselineProjects.map(renderProjectCard).join("\n");

  assert.equal((baselineHtml.match(/class="project-card"/g) ?? []).length, baselineProjects.length);
  for (const project of baselineProjects) {
    assert.ok(baselineHtml.includes(`href="${getProjectCardHref(project.id)}"`));
  }
});

test("CMS project-card IDs remain the fixed routing contract while copy stays editable", () => {
  assert.deepEqual(projects.map((project) => project.id), projectIds);
  for (const project of projects) {
    assert.equal(typeof project.title, "string");
    assert.equal(typeof project.focus, "string");
    assert.equal(typeof project.visible, "boolean");
  }
});

test("CMS project covers stay in the scoped WebP folder and metadata matches the real files", async () => {
  for (const project of projects) {
    assert.match(
      project.cover.src,
      /^\/media\/projects\/index\/[a-z0-9][a-z0-9-]*\.webp$/,
      `${project.id} cover must use the CMS project-cover path`,
    );

    const filePath = fileURLToPath(new URL(`../public${project.cover.src}`, import.meta.url));
    const metadata = await sharp(filePath).metadata();

    assert.equal(metadata.format, "webp", `${project.id} cover must be WebP`);
    assert.equal(metadata.width, project.cover.width, `${project.id} cover width metadata is stale`);
    assert.equal(metadata.height, project.cover.height, `${project.id} cover height metadata is stale`);
  }
});

test("CMS project covers are derived into the typed media registry", () => {
  assert.equal(projectIndexMediaAssets.length, projects.length);

  for (const project of projects) {
    const asset = projectIndexMediaAssetFor(project);
    assert.deepEqual(
      projectIndexMediaAssets.find(({ id }) => id === asset.id),
      asset,
      `${project.id} cover must be present in the live registry`,
    );
    assert.equal(asset.type, "image");
    assert.equal(asset.src, project.cover.src);
    assert.equal(asset.width, project.cover.width);
    assert.equal(asset.height, project.cover.height);
  }

  const uploadedCover = {
    ...projects[0],
    cover: {
      ...projects[0].cover,
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
  const html = renderProjectCard(projects[0]);

  assert.match(html, /\ssrcset="[^"]+"/);
  assert.match(html, /\ssizes="[^"]+"/);
  assert.match(html, /\/media\/generated\/responsive\/projects\/index\/jestei-pool-cover@/);

  const uploadedCover = {
    ...projects[0],
    cover: {
      ...projects[0].cover,
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
  assert.doesNotMatch(projectCardsConfig, /- name: (route|canonical|listed|indexable|slug|pageType)\b/);
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
