import "./text-desk.css";

import type { ContentDeskTextEntry } from "./editor-model.ts";
import { analyzeTextDeskEntries, filterTextDeskEntries } from "./text-analysis.ts";

const PAGES_CMS_URL = "https://app.pagescms.org/";
const TEXT_API = "/__media-desk/texts";
const GITHUB_SOURCE_ROOT = "https://github.com/looksawful/looksawful.ru/blob/dev/";

type SaveState = "saved" | "unsaved" | "saving" | "error";

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const sourceName = (path: string): string => path.split("/").at(-1) ?? path;

function buildAnalysis(entries: readonly ContentDeskTextEntry[]): HTMLElement {
  const analysis = analyzeTextDeskEntries(entries);
  const details = element("details", "text-desk__analysis");
  details.append(element("summary", undefined, "Анализ текстов"));
  const stats = element("div", "text-desk__analysis-stats");
  for (const [label, value] of [
    ["Поля", analysis.totalEntries],
    ["Sources", analysis.uniqueSources],
    ["Пустые", analysis.emptyValues],
    ["Средняя длина", analysis.averageLength.toFixed(1)],
    ["Медиана", analysis.medianLength.toFixed(1)],
    ["Повторы", analysis.repeatedValues.length],
  ] as const) {
    const card = element("div", "text-desk__stat");
    card.append(element("span", undefined, label), element("strong", undefined, String(value)));
    stats.append(card);
  }
  const table = element("div", "text-desk__analysis-table");
  table.append(element("strong", undefined, "Поля по source"));
  for (const item of analysis.entriesPerSource.slice(0, 12)) {
    const row = element("div", "text-desk__analysis-row");
    row.append(element("code", undefined, item.sourcePath), element("span", undefined, String(item.count)));
    table.append(row);
  }
  details.append(stats, table);
  return details;
}

function resultRow(entry: ContentDeskTextEntry, selected: boolean, onSelect: () => void): HTMLButtonElement {
  const button = element("button", `text-desk__result${selected ? " is-selected" : ""}`);
  button.type = "button";
  button.addEventListener("click", onSelect);
  const meta = element("span", "text-desk__result-meta");
  meta.append(element("strong", undefined, sourceName(entry.sourcePath)), element("code", undefined, entry.fieldPath));
  button.append(
    meta,
    element("span", `text-desk__result-preview${entry.value ? "" : " is-empty"}`, entry.value || "Пустое поле"),
  );
  return button;
}

function setSaveState(node: HTMLElement, state: SaveState, message?: string): void {
  const labels: Record<SaveState, string> = {
    saved: "Сохранено",
    unsaved: "Есть несохранённые изменения",
    saving: "Сохраняю…",
    error: "Ошибка",
  };
  node.dataset.state = state;
  node.textContent = message ? `${labels[state]} · ${message}` : labels[state];
}

function detailPane(entry: ContentDeskTextEntry, onBack: () => void, onSaved: () => void): HTMLElement {
  const pane = element("aside", "text-desk__detail");
  const header = element("header", "text-desk__detail-header");
  const back = element("button", "text-desk__back", "Назад");
  back.type = "button";
  back.addEventListener("click", onBack);
  const title = element("div", "text-desk__detail-title");
  title.append(element("strong", undefined, sourceName(entry.sourcePath)), element("code", undefined, entry.fieldPath));
  header.append(back, title);

  const textarea = element("textarea", "text-desk__editor");
  textarea.value = entry.value;
  const stateNode = element("span", "text-desk__save-state");
  let state: SaveState = "saved";
  setSaveState(stateNode, state);
  textarea.addEventListener("input", () => {
    if (state !== "saving") {
      state = "unsaved";
      setSaveState(stateNode, state);
    }
  });

  const actions = element("div", "text-desk__actions");
  const save = element("button", "text-desk__action text-desk__action--primary", "Сохранить");
  save.type = "button";
  const copy = element("button", "text-desk__action", "Копировать путь");
  copy.type = "button";
  const source = element("a", "text-desk__action", "Открыть source");
  source.href = `${GITHUB_SOURCE_ROOT}${entry.sourcePath}`;
  source.target = "_blank";
  source.rel = "noreferrer";
  const cms = element("a", "text-desk__action", "Открыть Pages CMS");
  cms.href = PAGES_CMS_URL;
  cms.target = "_blank";
  cms.rel = "noreferrer";

  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(`${entry.sourcePath} · ${entry.fieldPath}`);
    copy.textContent = "Скопировано";
  });
  save.addEventListener("click", async () => {
    if (state === "saving") return;
    state = "saving";
    save.disabled = true;
    setSaveState(stateNode, state);
    try {
      const response = await fetch(TEXT_API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourcePath: entry.sourcePath, fieldPath: entry.fieldPath, value: textarea.value }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      entry.value = textarea.value;
      state = "saved";
      setSaveState(stateNode, state);
      onSaved();
      document.dispatchEvent(new CustomEvent("content-desk:text-saved", {
        detail: { sourcePath: entry.sourcePath, fieldPath: entry.fieldPath, value: entry.value },
      }));
    } catch (error) {
      state = "error";
      setSaveState(stateNode, state, error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      save.disabled = false;
    }
  });

  const footer = element("div", "text-desk__detail-footer");
  actions.append(save, copy, source, cms);
  footer.append(stateNode, actions);
  pane.append(header, element("code", "text-desk__source-path", entry.sourcePath), textarea, footer);
  return pane;
}

export async function renderContentDeskTextView(app: HTMLElement): Promise<void> {
  for (const selector of [
    ".media-desk__toolbar",
    ".media-desk__status",
    ".media-desk__grid",
    ".media-desk__pagination",
    ".media-desk__dialog",
    "#media-desk-inspector",
  ]) {
    const node = app.querySelector<HTMLElement>(selector);
    if (node) node.hidden = true;
  }
  app.querySelector(".text-desk")?.remove();
  const root = element("section", "text-desk");
  const loading = element("p", "text-desk__status", "Загружаю индекс текстов…");
  root.append(loading);
  app.append(root);

  try {
    const response = await fetch(TEXT_API);
    const payload = await response.json() as { ok?: boolean; entries?: ContentDeskTextEntry[]; error?: string };
    if (!response.ok || !payload.ok || !Array.isArray(payload.entries)) throw new Error(payload.error ?? `HTTP ${response.status}`);

    const entries = payload.entries.map((entry) => ({ ...entry }));
    const sources = [...new Set(entries.map(({ sourcePath }) => sourcePath))].sort();
    let selected: ContentDeskTextEntry | null = null;
    const summary = app.querySelector(".media-desk__summary");
    if (summary) summary.textContent = `${entries.length} текстовых полей · ${sources.length} sources`;

    const header = element("header", "text-desk__header");
    const heading = element("div");
    heading.append(element("h2", undefined, "Тексты"), element("p", undefined, `${entries.length} полей · ${sources.length} sources`));
    header.append(heading, buildAnalysis(entries));

    const controls = element("div", "text-desk__controls");
    const search = element("input", "text-desk__search");
    search.type = "search";
    search.placeholder = "Поиск по тексту, source или field…";
    const sourceFilter = element("select", "text-desk__source-filter");
    const all = element("option", undefined, "Все sources");
    all.value = "";
    sourceFilter.append(all);
    for (const sourcePath of sources) {
      const option = element("option", undefined, sourcePath);
      option.value = sourcePath;
      sourceFilter.append(option);
    }
    const count = element("span", "text-desk__count");
    controls.append(search, sourceFilter, count);

    const browser = element("div", "text-desk__browser");
    const list = element("div", "text-desk__results");
    const detail = element("div", "text-desk__detail-slot");
    detail.append(element("div", "text-desk__empty-detail", "Выбери текстовое поле"));
    browser.append(list, detail);
    root.replaceChildren(header, controls, browser);

    const render = (): void => {
      const filtered = filterTextDeskEntries(entries, { query: search.value, sourcePath: sourceFilter.value });
      count.textContent = `${filtered.length} найдено`;
      const fragment = document.createDocumentFragment();
      for (const entry of filtered) fragment.append(resultRow(entry, selected === entry, () => select(entry)));
      list.replaceChildren(fragment);
    };
    const select = (entry: ContentDeskTextEntry): void => {
      selected = entry;
      root.classList.add("text-desk--detail-open");
      detail.replaceChildren(detailPane(entry, () => root.classList.remove("text-desk--detail-open"), render));
      render();
    };

    search.addEventListener("input", render);
    sourceFilter.addEventListener("change", render);
    render();
  } catch (error) {
    loading.textContent = `Не удалось загрузить индекс текстов: ${error instanceof Error ? error.message : "Ошибка"}`;
  }
}
