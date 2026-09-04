import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PAGES_PATH = path.join(ROOT, ".pages.yml");
const WRITE = process.argv.includes("--write");
const START = "      - name: registered-media-catalog\n";
const END = "      - name: uploaded-media-catalog\n";

const REGISTERED_BLOCK = `      - name: registered-media-catalog
        label: Существующие медиа
        type: collection
        path: src/content/media-catalog/registered
        format: json
        filename: "{id}.json"
        operations:
          create: false
          rename: false
          delete: false
        view:
          fields: [title, date]
          primary: title
          sort: [title, date]
          search: [title, id, date, tags, credits]
          default:
            sort: title
            order: asc
        commit:
          templates:
            update: "content(cms): update registered media metadata {path}"
        actions:
          - name: verify-registered-media-catalog
            label: Проверить медиакаталог
            scope: collection
            workflow: ci-fast.yml
            ref: dev
            confirm:
              title: Проверить медиакаталог?
              message: Будут проверены свойства, категории, теги, TypeScript, сборка и быстрые тесты и production build. Эта кнопка ничего не публикует.
              button: Проверить
        fields:
          - name: id
            label: ID ассета
            type: string
            required: true
            hidden: true
            readonly: true
          - name: title
            label: Название в каталоге
            type: string
            required: true
            description: Короткое библиотечное название ассета.
          - name: alt
            label: Alt по умолчанию
            type: text
            description: Базовое описание для переиспользования. Usage-specific alt остаётся у MediaEntry.
          - name: description
            label: Описание
            type: text
          - name: date
            label: Год / период по умолчанию
            type: string
          - name: workAreaIds
            label: Направления
            component: media-catalog-work-area-ids
            description: Библиотечная классификация. Контекст конкретного использования может быть уточнён на MediaEntry.
          - name: projectTypeIds
            label: Типы работы и съёмки
            component: media-catalog-project-type-ids
          - name: deliverableIds
            label: Форматы и носители
            component: media-catalog-deliverable-ids
          - name: tags
            label: Свободные теги
            type: string
            list: true
            description: Библиотечные поисковые теги.
          - name: credits
            label: Авторы и кредиты по умолчанию
            type: string
            list: true
          - name: reusable
            label: Можно переиспользовать
            type: boolean
            required: true
          - name: archived
            label: В архиве
            type: boolean
            required: true

`;

export function registeredMediaCatalogCmsBlock(source) {
  const start = source.indexOf(START);
  if (start < 0) throw new Error("registered-media-catalog block not found");
  const end = source.indexOf(END, start + START.length);
  if (end < 0) throw new Error("uploaded-media-catalog block not found after registered block");
  return source.slice(start, end);
}

export function compactRegisteredMediaCatalogCms(source) {
  const current = registeredMediaCatalogCmsBlock(source);
  if (current === REGISTERED_BLOCK) return source;
  const start = source.indexOf(START);
  const end = source.indexOf(END, start + START.length);
  return `${source.slice(0, start)}${REGISTERED_BLOCK}${source.slice(end)}`;
}

async function main() {
  const source = await readFile(PAGES_PATH, "utf8");
  const next = compactRegisteredMediaCatalogCms(source);
  const changed = next !== source;
  process.stdout.write(`${JSON.stringify({ mode: WRITE ? "write" : "check", changed })}\n`);
  if (!changed) return;
  if (WRITE) {
    await writeFile(PAGES_PATH, next, "utf8");
    return;
  }
  process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
