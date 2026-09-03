/// <reference types="vite/client" />

import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.css";
import "./editor.css";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  mediaCatalogDeliverables,
  mediaCatalogProjectTypes,
  mediaCatalogWorkAreas,
} from "../../data/taxonomy/media-taxonomy.ts";
import { connectMediaDeskBulkEditor } from "./bulk-editor.ts";
import {
  applyMediaEditorialPatchToItem,
  buildMediaEditorialPatch,
} from "./editor-serialization.ts";
import {
  pickMediaEditorialMetadata,
  type ContentDeskTextEntry,
  type MediaEditorialPatch,
} from "./editor-model.ts";

const PAGES_CMS_URL = "https://app.pagescms.org/";
const TEXT_RENDER_LIMIT = 500;
const CAN_WRITE_MEDIA = import.meta.env.VITE_CONTENT_DESK_WRITE === "1";
const MOBILE_BREAKPOINT = 899;
const editorialOverrides = new Map<string, MediaEditorialPatch>();

document.addEventListener("media-desk:metadata-saved", (event) => {
  const detail = (event as CustomEvent<{ id?: string; metadata?: MediaEditorialPatch }>).detail;
  if (detail?.id && detail.metadata) editorialOverrides.set(detail.id, detail.metadata);
});

type SaveState = "saved" | "unsaved" | "saving" | "error";

interface EditorSession {
  item: MediaCatalogItem;
  form: HTMLFormElement;
  getState(): SaveState;
  destroy(): void;
}

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
  if (eyebrow) {
    eyebrow.textContent = CAN_WRITE_MEDIA
      ? "Internal tool · local write mode"
      : "Internal tool · read only";
  }

  const navigation = element("nav", "content-desk__tabs");
  navigation.setAttribute("aria-label", "Content Desk разделы");
  navigation.append(
    tab("Медиа", "/tools/media-desk/", view === "media"),
    tab("Тексты", "/tools/media-desk/?view=text", view === "text"),
  );
  header.insertAdjacentElement("afterend", navigation);
}

function formField(label: string, control: HTMLElement, modifier = ""): HTMLLabelElement {
  const field = element("label", `content-desk__field${modifier ? ` ${modifier}` : ""}`);
  field.append(element("span", "content-desk__field-label", label), control);
  return field;
}

function textField(
  label: string,
  value: string,
  options: { multiline?: boolean; required?: boolean; short?: boolean } = {},
): { field: HTMLLabelElement; control: HTMLInputElement | HTMLTextAreaElement } {
  const control = options.multiline ? element("textarea") : element("input");
  control.value = value;
  if (options.required) control.required = true;
  return {
    field: formField(label, control, options.short ? "content-desk__field--short" : ""),
    control,
  };
}

function editorSection(title: string, description?: string): HTMLElement {
  const section = element("section", "content-desk__editor-section");
  const header = element("header", "content-desk__editor-section-header");
  header.append(element("h3", undefined, title));
  if (description) header.append(element("p", undefined, description));
  section.append(header);
  return section;
}

function taxonomyField(
  label: string,
  values: readonly string[],
  options: readonly { readonly id: string; readonly name: string }[],
): { field: HTMLLabelElement; tom: TomSelect } {
  const select = element("select");
  select.multiple = true;
  for (const item of options) {
    const option = element("option");
    option.value = item.id;
    option.textContent = item.name;
    option.selected = values.includes(item.id);
    select.append(option);
  }
  const field = formField(label, select);
  const tom = new TomSelect(select, {
    plugins: ["remove_button"],
    create: false,
    persist: false,
    maxItems: null,
    closeAfterSelect: false,
    hideSelected: true,
    items: [...values],
    searchField: ["text"],
  });
  return { field, tom };
}

function freeListField(
  label: string,
  values: readonly string[],
  suggestions: readonly string[],
): { field: HTMLLabelElement; tom: TomSelect } {
  const input = element("input");
  const field = formField(label, input);
  const options = [...new Set([...values, ...suggestions])]
    .filter(Boolean)
    .map((value) => ({ value, text: value }));
  const tom = new TomSelect(input, {
    plugins: ["remove_button"],
    create: true,
    persist: false,
    maxItems: null,
    delimiter: ",",
    items: [...values],
    options,
    valueField: "value",
    labelField: "text",
    searchField: ["text"],
  });
  return { field, tom };
}

function tomValues(control: TomSelect): string[] {
  const value = control.getValue();
  return (Array.isArray(value) ? value : value.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function currentEditorItem(item: MediaCatalogItem): MediaCatalogItem {
  const override = editorialOverrides.get(item.asset.id);
  return override ? applyMediaEditorialPatchToItem(item, override) : item;
}

function previewSummary(item: MediaCatalogItem): HTMLElement {
  const preview = element("div", "content-desk__preview");
  const media = item.asset.type === "video" ? element("video") : element("img");
  media.className = "content-desk__preview-media";
  if (media instanceof HTMLVideoElement) {
    media.src = item.asset.src;
    media.muted = true;
    media.preload = "metadata";
    media.playsInline = true;
  } else {
    media.src = item.posterSrc || item.asset.src;
    media.alt = item.alt;
    media.loading = "lazy";
  }
  const identity = element("div", "content-desk__preview-copy");
  identity.append(
    element("strong", undefined, item.title || item.asset.id),
    element("code", undefined, item.asset.id),
    element("span", undefined, `${item.asset.type} · ${item.origin}`),
  );
  preview.append(media, identity);
  return preview;
}

function technicalSection(item: MediaCatalogItem): HTMLDetailsElement {
  const details = element("details", "content-desk__technical");
  const summary = element("summary", undefined, "Technical");
  const list = element("dl", "content-desk__technical-list");
  const values: Array<[string, string]> = [
    ["Asset ID", item.asset.id],
    ["Source", item.asset.src],
    ["Type", item.asset.type],
    ["Dimensions", item.asset.width && item.asset.height ? `${item.asset.width} × ${item.asset.height}` : "—"],
    ["Duration", item.durationSeconds ? `${item.durationSeconds}s` : "—"],
    ["MIME", item.mimeType || "—"],
    ["Bytes", item.byteLength ? item.byteLength.toLocaleString() : "—"],
  ];
  if (item.asset.type === "video" && item.asset.sourceSrc) values.splice(2, 0, ["Master", item.asset.sourceSrc]);
  for (const [label, value] of values) {
    list.append(element("dt", undefined, label), element("dd", undefined, value));
  }
  details.append(summary, list);
  return details;
}

function setState(
  form: HTMLFormElement,
  stateNode: HTMLElement,
  saveButton: HTMLButtonElement,
  state: SaveState,
  message?: string,
): void {
  const labels: Record<SaveState, string> = {
    saved: "Сохранено",
    unsaved: "Есть несохранённые изменения",
    saving: "Сохраняю…",
    error: "Ошибка",
  };
  form.dataset.saveState = state;
  saveButton.disabled = state === "saving";
  stateNode.textContent = message ? `${labels[state]} · ${message}` : labels[state];
}

function buildMediaEditor(item: MediaCatalogItem): EditorSession {
  const metadata = pickMediaEditorialMetadata(item);
  const form = element("form", "content-desk__media-form");
  const tomControls: TomSelect[] = [];

  const general = editorSection("General");
  const title = textField("Название", metadata.title, { required: true });
  const date = textField("Дата / период", metadata.date, { short: true });
  general.append(title.field, date.field);

  const accessibility = editorSection("Accessibility");
  const alt = textField("Alt", metadata.alt, { multiline: true });
  const description = textField("Описание", metadata.description, { multiline: true });
  accessibility.append(alt.field, description.field);

  const classification = editorSection("Classification");
  const project = taxonomyField("Проекты", metadata.projectIds, projects.map(({ id, name }) => ({ id, name })));
  const workArea = taxonomyField("Направления", metadata.workAreaIds, mediaCatalogWorkAreas.map(({ id, name }) => ({ id, name })));
  const projectType = taxonomyField("Типы проекта", metadata.projectTypeIds, mediaCatalogProjectTypes.map(({ id, name }) => ({ id, name })));
  const deliverable = taxonomyField("Результаты", metadata.deliverableIds, mediaCatalogDeliverables.map(({ id, name }) => ({ id, name })));
  tomControls.push(project.tom, workArea.tom, projectType.tom, deliverable.tom);
  classification.append(project.field, workArea.field, projectType.field, deliverable.field);

  const tagSuggestions = mediaCatalogItems.flatMap((candidate) => candidate.tags);
  const tags = freeListField("Теги", metadata.tags, tagSuggestions);
  tomControls.push(tags.tom);
  classification.append(tags.field);

  const creditsSection = editorSection("Credits");
  const creditSuggestions = mediaCatalogItems.flatMap((candidate) => candidate.credits);
  const credits = freeListField("Авторы и кредиты", metadata.credits, creditSuggestions);
  tomControls.push(credits.tom);
  creditsSection.append(credits.field);

  const statusSection = editorSection("Status", "Статусы не удаляют source-файл.");
  const statusControls = element("div", "content-desk__status-controls");
  const reusable = element("label", "content-desk__status-control");
  const reusableInput = element("input");
  reusableInput.type = "checkbox";
  reusableInput.checked = metadata.reusable;
  reusable.append(reusableInput, document.createTextNode("Можно переиспользовать"));
  const archived = element("label", "content-desk__status-control content-desk__status-control--archived");
  const archivedInput = element("input");
  archivedInput.type = "checkbox";
  archivedInput.checked = metadata.archived;
  archived.append(archivedInput, document.createTextNode("В архиве"));
  statusControls.append(reusable, archived);
  statusSection.append(statusControls);

  const actions = element("div", "content-desk__form-actions");
  const save = element("button", "content-desk__action content-desk__action--primary", "Сохранить");
  save.type = "submit";
  const stateNode = element("span", "content-desk__save-state");
  actions.append(save, stateNode);
  form.append(general, accessibility, classification, creditsSection, statusSection, technicalSection(item), actions);

  let state: SaveState = "saved";
  const updateState = (next: SaveState, message?: string): void => {
    state = next;
    setState(form, stateNode, save, next, message);
  };
  updateState("saved");

  const markDirty = (): void => {
    if (state !== "saving") updateState("unsaved");
  };
  form.addEventListener("input", markDirty);
  form.addEventListener("change", markDirty);
  for (const control of tomControls) control.on("change", markDirty);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state === "saving") return;
    const next: MediaEditorialPatch = buildMediaEditorialPatch({
      title: title.control.value,
      alt: alt.control.value,
      description: description.control.value,
      date: date.control.value,
      projectIds: tomValues(project.tom),
      workAreaIds: tomValues(workArea.tom),
      projectTypeIds: tomValues(projectType.tom),
      deliverableIds: tomValues(deliverable.tom),
      tags: tomValues(tags.tom),
      credits: tomValues(credits.tom),
      reusable: reusableInput.checked,
      archived: archivedInput.checked,
    });
    if (!next.title) {
      title.control.focus();
      updateState("error", "Название обязательно");
      return;
    }

    updateState("saving");
    try {
      const response = await fetch("/__media-desk/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.asset.id, metadata: next }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      editorialOverrides.set(item.asset.id, next);
      updateState("saved");
      document.dispatchEvent(new CustomEvent("media-desk:metadata-saved", {
        detail: { id: item.asset.id, metadata: next, origin: "single" },
      }));
    } catch (error) {
      updateState("error", error instanceof Error ? error.message : "Ошибка сохранения");
    }
  });

  return {
    item,
    form,
    getState: () => state,
    destroy: () => {
      for (const control of tomControls) control.destroy();
    },
  };
}

function renderEditor(
  target: HTMLElement,
  session: EditorSession,
  persistent: boolean,
  onClose?: () => void,
): void {
  const shell = element("div", "content-desk__inspector-shell");
  const header = element("header", "content-desk__inspector-header");
  header.append(element("span", "content-desk__inspector-kicker", "Media metadata"));
  if (persistent) {
    const close = element("button", "content-desk__inspector-close", "Закрыть");
    close.type = "button";
    close.addEventListener("click", () => {
      if (session.getState() === "unsaved" && !window.confirm("Закрыть Inspector и потерять несохранённые изменения?")) return;
      session.destroy();
      onClose?.();
      target.replaceChildren();
      target.removeAttribute("data-open");
      document.documentElement.classList.remove("content-desk--inspector-open");
    });
    header.append(close);
  }
  shell.append(header, previewSummary(session.item), session.form);
  target.replaceChildren(shell);
  if (persistent) {
    target.dataset.open = "true";
    document.documentElement.classList.add("content-desk--inspector-open");
    if (window.innerWidth <= MOBILE_BREAKPOINT) target.scrollTop = 0;
  }
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
  const canonical = mediaCatalogItems.find((candidate) => candidate.asset.id === assetIdFromDialog(dialog));
  const content = dialog.querySelector(".media-desk__dialog-content");
  if (!canonical || !(content instanceof HTMLElement)) return;
  renderEditor(content, buildMediaEditor(currentEditorItem(canonical)), false);
}

function connectPersistentInspector(): void {
  const inspector = document.querySelector<HTMLElement>("#media-desk-inspector");
  if (!inspector) return;
  let active: EditorSession | null = null;

  const rebuild = (id: string): void => {
    const canonical = mediaCatalogItems.find((candidate) => candidate.asset.id === id);
    if (!canonical) return;
    active?.destroy();
    const next = buildMediaEditor(currentEditorItem(canonical));
    active = next;
    renderEditor(inspector, next, true, () => {
      if (active === next) active = null;
    });
  };

  const open = (id: string): void => {
    if (!id) return;
    if (active?.item.asset.id === id) {
      if (active.getState() === "unsaved") return;
      rebuild(id);
      return;
    }
    if (active?.getState() === "unsaved" && !window.confirm("Переключиться и потерять несохранённые изменения?")) return;
    rebuild(id);
  };

  document.addEventListener("media-desk:metadata-saved", (event) => {
    const detail = (event as CustomEvent<{
      id?: string;
      metadata?: MediaEditorialPatch;
      origin?: "single" | "bulk";
    }>).detail;
    if (!detail?.id || !detail.metadata || detail.origin === "single") return;
    if (active?.item.asset.id !== detail.id || active.getState() !== "saved") return;
    rebuild(detail.id);
  });

  document.addEventListener("media-desk:asset-select", (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id) open(id);
  });
  document.addEventListener("media-desk:selection-change", (event) => {
    const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];
    if (ids.length === 1) open(ids[0]);
  });
}

function textCard(entry: ContentDeskTextEntry): HTMLElement {
  const card = element("article", "content-desk__text-card");
  const meta = element("div", "content-desk__text-meta");
  meta.append(element("code", undefined, entry.sourcePath), element("code", undefined, entry.fieldPath));
  const value = element("p", `content-desk__text-value${entry.value ? "" : " content-desk__empty-value"}`, entry.value || "Пустое поле");
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

async function renderTextView(app: HTMLElement): Promise<void> {
  for (const selector of [".media-desk__toolbar", ".media-desk__status", ".media-desk__grid", ".media-desk__pagination", ".media-desk__dialog"]) {
    const node = app.querySelector<HTMLElement>(selector);
    if (node) node.hidden = true;
  }
  const summary = app.querySelector(".media-desk__summary");
  const section = element("section", "content-desk__texts");
  const status = element("p", "content-desk__save-state", "Загружаю индекс текстов…");
  section.append(status);
  app.append(section);
  try {
    const response = await fetch("/__media-desk/texts");
    const payload = await response.json() as { ok?: boolean; entries?: ContentDeskTextEntry[]; error?: string };
    if (!response.ok || !payload.ok || !Array.isArray(payload.entries)) throw new Error(payload.error ?? `HTTP ${response.status}`);
    const entries = payload.entries;
    const sources = [...new Set(entries.map(({ sourcePath }) => sourcePath))].sort();
    if (summary) summary.textContent = `${entries.length} текстовых полей · ${sources.length} sources`;
    const controls = element("div", "content-desk__text-controls");
    const search = element("input", "content-desk__search");
    search.type = "search";
    search.placeholder = "Поиск по тексту, source или полю…";
    const sourceFilter = element("select", "content-desk__source-filter");
    const all = element("option", undefined, "Все sources");
    all.value = "";
    sourceFilter.append(all);
    for (const sourcePath of sources) {
      const option = element("option", undefined, sourcePath);
      option.value = sourcePath;
      sourceFilter.append(option);
    }
    controls.append(search, sourceFilter);
    const list = element("div", "content-desk__text-list");
    section.replaceChildren(controls, status, list);
    const render = (): void => {
      const query = search.value.trim().toLocaleLowerCase();
      const filtered = entries.filter((entry) => {
        if (sourceFilter.value && entry.sourcePath !== sourceFilter.value) return false;
        return !query || `${entry.sourcePath} ${entry.fieldPath} ${entry.value}`.toLocaleLowerCase().includes(query);
      });
      status.textContent = filtered.length > TEXT_RENDER_LIMIT ? `${filtered.length} найдено · показываются первые ${TEXT_RENDER_LIMIT}` : `${filtered.length} найдено`;
      const fragment = document.createDocumentFragment();
      for (const entry of filtered.slice(0, TEXT_RENDER_LIMIT)) fragment.append(textCard(entry));
      list.replaceChildren(fragment);
    };
    search.addEventListener("input", render);
    sourceFilter.addEventListener("change", render);
    render();
  } catch (error) {
    status.textContent = `Не удалось загрузить индекс текстов: ${error instanceof Error ? error.message : "Ошибка загрузки текстов"}`;
    if (summary) summary.textContent = "Text index unavailable";
  }
}

const app = document.querySelector<HTMLElement>(".media-desk");
if (app) {
  const view = new URLSearchParams(location.search).get("view") === "text" ? "text" : "media";
  addTabs(app, view);
  if (view === "text") {
    void renderTextView(app);
  } else if (CAN_WRITE_MEDIA) {
    connectPersistentInspector();
    connectMediaDeskBulkEditor();
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".media-card")) return;
      queueMicrotask(enhanceMediaDialog);
    });
  }
}
