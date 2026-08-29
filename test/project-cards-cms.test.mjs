import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { projects } from "../src/data/projects.ts";
import { renderProjectCard } from "../src/templates/project-card.ts";

const cmsConfig = readFileSync(new URL("../.pages.yml", import.meta.url), "utf8");
const publishWorkflow = readFileSync(
  new URL("../.github/workflows/pages-cms-publish.yml", import.meta.url),
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

test("CMS project-card migration preserves rendered output exactly", () => {
  const before = baselineProjects.map(renderProjectCard).join("\n");
  const after = projects.map(renderProjectCard).join("\n");
  assert.equal(after, before);
});

test("CMS project-card IDs remain the fixed routing contract", () => {
  assert.deepEqual(projects.map((project) => project.id), ["jestei", "styx", "sensetique", "shootings"]);
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

test("Pages CMS keeps project-card identity and destructive operations locked", () => {
  assert.match(cmsConfig, /operations:\s*\n\s+create: false\s*\n\s+rename: false\s*\n\s+delete: false/);
  assert.match(cmsConfig, /- name: id\s*\n\s+label: ID\s*\n\s+type: string\s*\n\s+required: true\s*\n\s+readonly: true/);
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
  assert.match(cmsConfig, /label: Проверить сайт/);
  assert.match(cmsConfig, /confirm:\s*\n\s+title: Запустить полную проверку сайта\?/);
  assert.doesNotMatch(cmsConfig, /- name: (route|canonical|listed|indexable|slug|pageType)\b/);
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
