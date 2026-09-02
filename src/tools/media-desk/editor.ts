/// <reference types="vite/client" />

import "./editor.css";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  mediaCatalogDeliverables,
  mediaCatalogProjectTypes,
  mediaCatalogWorkAreas,
} from "../../data/taxonomy/media-taxonomy.ts";
import {
  collectContentDeskTextEntries,
  pickMediaEditorialMetadata,
  type ContentDeskTextEntry,
  type MediaEditorialPatch,
} from "./editor-model.ts";

const PAGES_CMS_URL = "https://app.pagescms.org/";
const TEXT_RENDER_LIMIT = 500;

const textSources = import.meta.glob(
  [
    "../../content/navigation.json",
    "../../content/editorial/*.json",
    "../../content/projects.json",
    "../../content/cases/*.json",
    "../../content/collections/*.json",
    "../../content/shootings/*.json",
    "../../content/standalone-projects/*.json",
  ],
  { eager: true, import: "default" },
) as Record<string, unknown>;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function tab(label: string, href: string, active: boolean): HTMLAnchorElement {
  const link = element("a", "content-desk__tab", label);
  link.href = href;
  if (active) link.setAttribute("aria-current", "page");
  return link;
}

function addTabs(app: HTMLElement, view: "media" | "text"): void {
  const header = app.querySelector(".media-desk__header");
  if (!(header instanceof HTMLElement)) return;
  const title = header.querySelector("h1");
  if (title) title.textContent = "Content Desk";
  const eyebrow = header.querySelector(".media-desk__eyebrow");
  if (eyebrow) eyebrow.textContent = "Internal tool · local content workspace";

  const navigation = element("nav", "content-desk__tabs");
  navigation.setAttribute("aria-label", "Content Desk разделы");
  navigation.append(
    tab("Медиа", "/tools/media-desk/", view === "media"),
    tab("Тексты", "/tools/media-desk/?view=text", view === "text"),
  );
  header.insertAdjacentElement("afterend", navigation);
}

function inputField(label: string, value: string, multiline = false): HTMLLabelElement {
  const field = element("label", "content-desk__field");
  field.append(element("span", undefined, label));
  const control = multiline ? element("textarea") : element("input");
  control.value = value;
  field.append(control);
  return field;
}

function selectedValues(select: HTMLSelectElement): string[] {
  return [...select.selectedOptions].map(({ value }) => value);
}

function multiSelectField(
  label: string,
  values: readonly string[],
  options: readonly { readonly id: string; readonly name: string }[],
): { field: HTMLLabelElement; select: HTMLSelectElement } {
  const field = element("label", "content-desk__field");
  field.append(element("span", undefined, label));
  const select = element("select");
  select.multiple = true;
  for (const optionValue of options) {
    const option = element("option");
    option.value = optionValue.id;
    option.textContent = optionValue.name;
    option.selected = values.includes(optionValue.id);
    select.append(option);
  }
  field.append(select);
  return { field, select };
}

function lineList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function assetIdFromDialog(dialog: HTMLDialogElement): string {
  for (const term of dialog.querySelectorAll("dt")) {
    if (term.textContent?.trim() !== "Asset ID") continue;
    return term.nextElementSibling?.textContent?.trim() ?? "";
  }
  return "";
}

function enhanceMediaDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>(".media-desk__dialog[open]");
  if (!dialog || dialog.querySelector(".content-desk__media-form")) return;

  const id = assetIdFromDialog(dialog);
  const item = mediaCatalogItems.find((candidate) => candidate.asset.id === id);
  if (!item) return;

  const content = dialog.querySelector(".media-desk__dialog-content");
  if (!(content instanceof HTMLElement)) return;
  content.append(buildMediaEditor(item));
}

function buildMediaEditor(item: MediaCatalogItem): HTMLFormElement {
  const metadata = pickMediaEditorialMetadata(item);
  const form = element("form", "content-desk__media-form");
  form.append(element("h3", undefined, "Редактировать metadata"));

  const title = inputField("Название", metadata.title);
  const titleInput = title.querySelector("input") as HTMLInputElement;
  titleInput.required = true;
  const alt = inputField("Alt", metadata.alt, true);
  const description = inputField("Описание", metadata.description, true);
  const date = inputField("Дата", metadata.date);

  const project = multiSelectField(
    "Проекты",
    metadata.projectIds,
    projects.map(({ id, name }) => ({ id, name })),
  );
  const workArea = multiSelectField(
    "Направления",
    metadata.workAreaIds,
    mediaCatalogWorkAreas.map(({ id, name }) => ({ id, name })),
  );
  const projectType = multiSelectField(
    "Типы проекта",
    metadata.projectTypeIds,
    mediaCatalogProjectTypes.map(({ id, name }) => ({ id, name })),
  );
  const deliverable = multiSelectField(
    "Результаты",
    metadata.deliverableIds,
    mediaCatalogDeliverables.map(({ id, name }) => ({ id, name })),
  );

  const tags = inputField("Теги · один на строку", metadata.tags.join("\n"), true);
  const credits = inputField("Credits · один на строку", metadata.credits.join("\n"), true);

  const checks = element("div", "content-desk__checks");
  const reusable = element("label", "content-desk__check");
  const reusableInput = element("input");
  reusableInput.type = "checkbox";
  reusableInput.checked = metadata.reusable;
  reusable.append(reusableInput, document.createTextNode("Переиспользуемое"));

  const archived = element("label", "content-desk__check");
  const archivedInput = element("input");
  archivedInput.type = "checkbox";
  archivedInput.checked = metadata.archived;
  archived.append(archivedInput, document.createTextNode("Архив"));
  checks.append(reusable, archived);

  const actions = element("div", "content-desk__form-actions");
  const save = element("button", "content-desk__action", "Сохранить metadata");
  save.type = "submit";
  const state = element("span", "content-desk__save-state", "Изменяются только editorial поля");
  actions.append(save, state);

  form.append(
    title,
    alt,
    description,
    date,
    project.field,
    workArea.field,
    projectType.field,
    deliverable.field,
    tags,
    credits,
    checks,
    actions,
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    state.textContent = "Сохраняю…";

    const next: MediaEditorialPatch = {
      title: titleInput.value.trim(),
      alt: (alt.querySelector("textarea") as HTMLTextAreaElement).value.trim(),
      description: (description.querySelector("textarea") as HTMLTextAreaElement).value.trim(),
      date: (date.querySelector("input") as HTMLInputElement).value.trim(),
      projectIds: selectedValues(project.select) as MediaEditorialPatch["projectIds"],
      workAreaIds: selectedValues(workArea.select) as MediaEditorialPatch["workAreaIds"],
      projectTypeIds: selectedValues(projectType.select) as MediaEditorialPatch["projectTypeIds"],
      deliverableIds: selectedValues(deliverable.select) as MediaEditorialPatch["deliverableIds"],
      tags: lineList((tags.querySelector("textarea") as HTMLTextAreaElement).value),
      credits: lineList((credits.querySelector("textarea") as HTMLTextAreaElement).value),
      reusable: reusableInput.checked,
      archived: archivedInput.checked,
    };

    try {
      const response = await fetch("/__media-desk/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.asset.id, metadata: next }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      state.textContent = "Сохранено. Перезагружаю каталог…";
      window.setTimeout(() => location.reload(), 250);
    } catch (error) {
      state.textContent = error instanceof Error ? error.message : "Ошибка сохранения";
      save.disabled = false;
    }
  });

  return form;
}

function textCard(entry: ContentDeskTextEntry): HTMLElement {
  const card = element("article", "content-desk__text-card");
  const meta = element("div", "content-desk__text-meta");
  meta.append(
    element("code", undefined, entry.sourcePath),
    element("code", undefined, entry.fieldPath),
  );

  const value = element(
    "p",
    `content-desk__text-value${entry.value ? "" : " content-desk__empty-value"}`,
    entry.value || "Пустое поле",
  );

  const actions = element("div", "content-desk__text-actions");
  const cms = element("a", "content-desk__action", "Открыть Pages CMS");
  cms.href = PAGES_CMS_URL;
  cms.target = "_blank";
  cms.rel = "noreferrer";

  const source = element("a", "content-desk__action", "Открыть source");
  source.href = `https://github.com/looksawful/looksawful.ru/blob/dev/${entry.sourcePath}`;
  source.target = "_blank";
  source.rel = "noreferrer";

  const copy = element("button", "content-desk__action", "Копировать путь");
  copy.type = "button";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(`${entry.sourcePath} · ${entry.fieldPath}`);
    copy.textContent = "Скопировано";
  });
  actions.append(cms, source, copy);

  card.append(meta, value, actions);
  return card;
}

function renderTextView(app: HTMLElement): void {
  for (const selector of [
    ".media-desk__toolbar",
    ".media-desk__status",
    ".media-desk__grid",
    ".media-desk__pagination",
    ".media-desk__dialog",
  ]) {
    const node = app.querySelector<HTMLElement>(selector);
    if (node) node.hidden = true;
  }

  const entries = collectContentDeskTextEntries(textSources);
  const sources = [...new Set(entries.map(({ sourcePath }) => sourcePath))].sort();
  const summary = app.querySelector(".media-desk__summary");
  if (summary) summary.textContent = `${entries.length} текстовых полей · ${sources.length} sources`;

  const section = element("section", "content-desk__texts");
  const controls = element("div", "content-desk__text-controls");
  const search = element("input", "content-desk__search");
  search.type = "search";
  search.placeholder = "Поиск по тексту, source или полю…";
  search.setAttribute("aria-label", "Поиск по текстам сайта");

  const sourceFilter = element("select", "content-desk__source-filter");
  sourceFilter.setAttribute("aria-label", "Источник текста");
  const all = element("option", undefined, "Все sources");
  all.value = "";
  sourceFilter.append(all);
  for (const sourcePath of sources) {
    const option = element("option", undefined, sourcePath);
    option.value = sourcePath;
    sourceFilter.append(option);
  }
  controls.append(search, sourceFilter);

  const status = element("p", "content-desk__save-state");
  const list = element("div", "content-desk__text-list");

  const render = (): void => {
    const query = search.value.trim().toLocaleLowerCase();
    const selectedSource = sourceFilter.value;
    const filtered = entries.filter((entry) => {
      if (selectedSource && entry.sourcePath !== selectedSource) return false;
      if (!query) return true;
      return `${entry.sourcePath} ${entry.fieldPath} ${entry.value}`.toLocaleLowerCase().includes(query);
    });
    const visible = filtered.slice(0, TEXT_RENDER_LIMIT);
    status.textContent = filtered.length > TEXT_RENDER_LIMIT
      ? `${filtered.length} найдено · показываются первые ${TEXT_RENDER_LIMIT}`
      : `${filtered.length} найдено`;
    const fragment = document.createDocumentFragment();
    for (const entry of visible) fragment.append(textCard(entry));
    list.replaceChildren(fragment);
  };

  search.addEventListener("input", render);
  sourceFilter.addEventListener("change", render);
  section.append(controls, status, list);
  app.append(section);
  render();
}

const app = document.querySelector<HTMLElement>(".media-desk");
if (app) {
  const view = new URLSearchParams(location.search).get("view") === "text" ? "text" : "media";
  addTabs(app, view);

  if (view === "text") {
    renderTextView(app);
  } else {
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".media-card")) return;
      queueMicrotask(enhanceMediaDialog);
    });
  }
}
