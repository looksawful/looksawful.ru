import TomSelect from "tom-select";
import "./bulk-editor.css";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import { applyMediaEditorialPatchToItem } from "./editor-serialization.ts";
import type { MediaEditorialPatch } from "./editor-model.ts";
import {
  buildBulkMetadataRequest,
  type BulkArrayEdit,
  type BulkArrayMode,
  type BulkEditPlan,
} from "./bulk-editor-model.ts";

export const MEDIA_DESK_BULK_METADATA_ENDPOINT = "/__media-desk/metadata/bulk";

const sessionOverrides = new Map<string, MediaEditorialPatch>();

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

function currentItem(id: string): MediaCatalogItem | undefined {
  const canonical = mediaCatalogItems.find((item) => item.asset.id === id);
  if (!canonical) return undefined;
  const override = sessionOverrides.get(id);
  return override ? applyMediaEditorialPatchToItem(canonical, override) : canonical;
}

function operationSelect(label: string): HTMLLabelElement {
  const field = element("label", "content-desk__bulk-operation");
  field.append(element("span", undefined, label));
  const select = element("select");
  for (const [value, text] of [["add", "ADD"], ["remove", "REMOVE"], ["set", "SET / REPLACE"]] as const) {
    const option = element("option", undefined, text);
    option.value = value;
    select.append(option);
  }
  field.append(select);
  return field;
}

function booleanSelect(label: string): HTMLLabelElement {
  const field = element("label", "content-desk__bulk-boolean");
  field.append(element("span", undefined, label));
  const select = element("select");
  for (const [value, text] of [["", "Не менять"], ["true", "Set true"], ["false", "Set false"]] as const) {
    const option = element("option", undefined, text);
    option.value = value;
    select.append(option);
  }
  field.append(select);
  return field;
}

function selectedTomValues(tom: TomSelect): string[] {
  const value = tom.getValue();
  return (Array.isArray(value) ? value : value.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function readMode(field: HTMLLabelElement): BulkArrayMode {
  return (field.querySelector("select") as HTMLSelectElement).value as BulkArrayMode;
}

function readBoolean(field: HTMLLabelElement): boolean | undefined {
  const value = (field.querySelector("select") as HTMLSelectElement).value;
  return value === "true" ? true : value === "false" ? false : undefined;
}

export function connectMediaDeskBulkEditor(): void {
  if (document.querySelector(".content-desk__bulk-bar")) return;

  let selectedIds: string[] = [];
  let saving = false;

  const bar = element("section", "content-desk__bulk-bar");
  bar.hidden = true;
  bar.setAttribute("aria-label", "Bulk media metadata editor");

  const summary = element("strong", "content-desk__bulk-count", "0 выбрано");
  const edit = element("button", "content-desk__action", "Изменить");
  edit.type = "button";
  const clear = element("button", "content-desk__action content-desk__bulk-clear", "Clear");
  clear.type = "button";
  const top = element("div", "content-desk__bulk-summary");
  top.append(summary, edit, clear);

  const panel = element("form", "content-desk__bulk-panel");
  panel.hidden = true;

  const projectGroup = element("fieldset", "content-desk__bulk-field");
  const projectLegend = element("label", "content-desk__bulk-enable");
  const projectEnabled = element("input");
  projectEnabled.type = "checkbox";
  projectLegend.append(projectEnabled, document.createTextNode(" Projects"));
  const projectMode = operationSelect("Операция");
  const projectSelect = element("select");
  projectSelect.multiple = true;
  for (const project of projects) {
    const option = element("option", undefined, project.name);
    option.value = project.id;
    projectSelect.append(option);
  }
  projectGroup.append(projectLegend, projectMode, projectSelect);

  const tagGroup = element("fieldset", "content-desk__bulk-field");
  const tagLegend = element("label", "content-desk__bulk-enable");
  const tagsEnabled = element("input");
  tagsEnabled.type = "checkbox";
  tagLegend.append(tagsEnabled, document.createTextNode(" Tags"));
  const tagMode = operationSelect("Операция");
  const tagInput = element("input");
  tagGroup.append(tagLegend, tagMode, tagInput);

  const projectTom = new TomSelect(projectSelect, {
    plugins: ["remove_button"],
    create: false,
    persist: false,
    maxItems: null,
    closeAfterSelect: false,
    searchField: ["text"],
  });
  const tagSuggestions = [...new Set(mediaCatalogItems.flatMap((item) => item.tags))]
    .filter(Boolean)
    .map((value) => ({ value, text: value }));
  const tagTom = new TomSelect(tagInput, {
    plugins: ["remove_button"],
    create: true,
    persist: false,
    maxItems: null,
    delimiter: ",",
    options: tagSuggestions,
    valueField: "value",
    labelField: "text",
    searchField: ["text"],
  });

  const booleans = element("div", "content-desk__bulk-booleans");
  const reusable = booleanSelect("Reusable");
  const archived = booleanSelect("Archived");
  booleans.append(reusable, archived);

  const actions = element("div", "content-desk__bulk-actions");
  const save = element("button", "content-desk__action content-desk__action--primary", "Применить");
  save.type = "submit";
  const cancel = element("button", "content-desk__action", "Закрыть");
  cancel.type = "button";
  const state = element("span", "content-desk__save-state", "Выберите поля и операцию");
  actions.append(save, cancel, state);

  panel.append(projectGroup, tagGroup, booleans, actions);
  bar.append(top, panel);
  document.body.append(bar);

  const setVisible = (): void => {
    bar.hidden = selectedIds.length < 2;
    summary.textContent = `${selectedIds.length} выбрано`;
    if (bar.hidden) panel.hidden = true;
  };

  document.addEventListener("media-desk:metadata-saved", (event) => {
    const detail = (event as CustomEvent<{ id?: string; metadata?: MediaEditorialPatch }>).detail;
    if (detail?.id && detail.metadata) sessionOverrides.set(detail.id, detail.metadata);
  });

  document.addEventListener("media-desk:selection-change", (event) => {
    const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];
    selectedIds = [...new Set(ids)].filter(Boolean);
    setVisible();
  });

  edit.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  cancel.addEventListener("click", () => {
    panel.hidden = true;
  });
  clear.addEventListener("click", () => {
    selectedIds = [];
    setVisible();
    document.dispatchEvent(new CustomEvent("media-desk:selection-clear"));
  });

  panel.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving || selectedIds.length < 2) return;

    const arrays: BulkArrayEdit[] = [];
    if (projectEnabled.checked) {
      arrays.push({ field: "projectIds", mode: readMode(projectMode), values: selectedTomValues(projectTom) });
    }
    if (tagsEnabled.checked) {
      arrays.push({ field: "tags", mode: readMode(tagMode), values: selectedTomValues(tagTom) });
    }
    const reusableValue = readBoolean(reusable);
    const archivedValue = readBoolean(archived);
    if (arrays.length === 0 && reusableValue === undefined && archivedValue === undefined) {
      state.textContent = "Выберите хотя бы одно изменение";
      return;
    }

    const items = selectedIds.map(currentItem).filter((item): item is MediaCatalogItem => Boolean(item));
    if (items.length !== selectedIds.length) {
      state.textContent = "Некоторые assets больше не доступны";
      return;
    }

    const plan: BulkEditPlan = {
      arrays,
      ...(reusableValue === undefined ? {} : { reusable: reusableValue }),
      ...(archivedValue === undefined ? {} : { archived: archivedValue }),
    };
    const batch = buildBulkMetadataRequest(items, plan);

    saving = true;
    save.disabled = true;
    state.textContent = "Saving…";
    try {
      const response = await fetch(MEDIA_DESK_BULK_METADATA_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);

      for (const entry of batch) {
        sessionOverrides.set(entry.id, entry.metadata);
        document.dispatchEvent(new CustomEvent("media-desk:metadata-saved", {
          detail: { id: entry.id, metadata: entry.metadata },
        }));
      }
      state.textContent = `${batch.length} assets updated`;
    } catch (error) {
      state.textContent = error instanceof Error ? error.message : "Bulk save failed";
    } finally {
      saving = false;
      save.disabled = false;
    }
  });
}
