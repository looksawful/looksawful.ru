import TomSelect from "tom-select";

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

export const MEDIA_DESK_BULK_METADATA_ENDPOINT =
  "/__media-desk/metadata/bulk";

const sessionOverrides = new Map<string, Partial<MediaEditorialPatch>>();

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
  const canonical = mediaCatalogItems.find(
    (item) => item.asset.id === id,
  );
  if (!canonical) return undefined;

  const override = sessionOverrides.get(id);
  return override
    ? applyMediaEditorialPatchToItem(canonical, override)
    : canonical;
}

function operationSelect(): HTMLSelectElement {
  const select = element("select", "md-input");

  for (const [value, text] of [
    ["add", "Добавить"],
    ["remove", "Удалить"],
    ["set", "Заменить"],
  ] as const) {
    const option = element("option", undefined, text);
    option.value = value;
    select.append(option);
  }

  return select;
}

function booleanSelect(): HTMLSelectElement {
  const select = element("select", "md-input");

  for (const [value, text] of [
    ["", "Не менять"],
    ["true", "Да"],
    ["false", "Нет"],
  ] as const) {
    const option = element("option", undefined, text);
    option.value = value;
    select.append(option);
  }

  return select;
}

function selectedTomValues(tom: TomSelect): string[] {
  const value = tom.getValue();
  return (Array.isArray(value) ? value : value.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function readBoolean(
  select: HTMLSelectElement,
): boolean | undefined {
  return select.value === "true"
    ? true
    : select.value === "false"
      ? false
      : undefined;
}

export function connectMediaDeskBulkEditor(
  host: HTMLElement,
): void {
  if (host.dataset.connected === "true") return;
  host.dataset.connected = "true";

  let selectedIds: string[] = [];
  let saving = false;

  const form = element("form", "md-bulk");

  const intro = element("div", "md-bulk__intro");
  const count = element("strong", undefined, "0 ассетов");
  const clear = element("button", "md-button", "Очистить выбор");
  clear.type = "button";
  intro.append(count, clear);

  const projectGroup = element("section", "md-bulk-group");
  const projectHeader = element("label", "md-bulk-toggle");
  const projectEnabled = element("input");
  projectEnabled.type = "checkbox";
  const projectLabel = document.createTextNode("Изменить проекты");
  projectHeader.append(projectEnabled, projectLabel);

  const projectMode = operationSelect();
  const projectSelect = element("select");
  projectSelect.multiple = true;

  for (const project of projects) {
    const option = element("option", undefined, project.name);
    option.value = project.id;
    projectSelect.append(option);
  }

  projectGroup.append(projectHeader, projectMode, projectSelect);

  const tagsGroup = element("section", "md-bulk-group");
  const tagsHeader = element("label", "md-bulk-toggle");
  const tagsEnabled = element("input");
  tagsEnabled.type = "checkbox";
  tagsHeader.append(
    tagsEnabled,
    document.createTextNode("Изменить теги"),
  );

  const tagMode = operationSelect();
  const tagInput = element("input", "md-input");
  tagsGroup.append(tagsHeader, tagMode, tagInput);

  const projectTom = new TomSelect(projectSelect, {
    plugins: ["remove_button"],
    create: false,
    persist: false,
    maxItems: null,
    closeAfterSelect: false,
    searchField: ["text"],
  });

  const tagSuggestions = [
    ...new Set(mediaCatalogItems.flatMap((item) => item.tags)),
  ]
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

  const statusGroup = element("section", "md-bulk-group");
  const reusable = booleanSelect();
  const archived = booleanSelect();

  const reusableField = element("label", "md-field");
  reusableField.append(
    element("span", "md-field__label", "Reusable"),
    reusable,
  );

  const archivedField = element("label", "md-field");
  archivedField.append(
    element("span", "md-field__label", "Archived"),
    archived,
  );

  statusGroup.append(reusableField, archivedField);

  const footer = element("footer", "md-editor-actions");
  const state = element(
    "span",
    "md-save-state",
    "Выберите изменения",
  );
  const save = element(
    "button",
    "md-button md-button--primary",
    "Применить",
  );
  save.type = "submit";
  footer.append(state, save);

  form.append(
    intro,
    projectGroup,
    tagsGroup,
    statusGroup,
    footer,
  );
  host.replaceChildren(form);

  const selectedItems = (): MediaCatalogItem[] =>
    selectedIds
      .map(currentItem)
      .filter((item): item is MediaCatalogItem => Boolean(item));

  const syncVisibility = (): void => {
    const items = selectedItems();
    const uploadCount = items.filter((item) => item.origin === "cms").length;
    const registeredCount = items.length - uploadCount;

    count.textContent = `${selectedIds.length} ассетов`;
    host.hidden = selectedIds.length < 2;

    projectGroup.hidden = uploadCount === 0;
    projectEnabled.disabled = uploadCount === 0;
    if (uploadCount === 0) {
      projectEnabled.checked = false;
    }
    projectLabel.textContent = registeredCount > 0
      ? `Изменить проекты (только загрузки: ${uploadCount})`
      : "Изменить проекты";
  };

  document.addEventListener("media-desk:metadata-saved", (event) => {
    const detail = (
      event as CustomEvent<{
        id?: string;
        metadata?: Partial<MediaEditorialPatch>;
      }>
    ).detail;

    if (detail?.id && detail.metadata) {
      sessionOverrides.set(detail.id, detail.metadata);
    }
  });

  document.addEventListener("media-desk:selection-change", (event) => {
    const ids =
      (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];

    selectedIds = [...new Set(ids)].filter(Boolean);
    syncVisibility();
  });

  clear.addEventListener("click", () => {
    selectedIds = [];
    syncVisibility();

    document.dispatchEvent(
      new CustomEvent("media-desk:selection-clear"),
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (saving || selectedIds.length < 2) return;

    const arrays: BulkArrayEdit[] = [];

    if (projectEnabled.checked && !projectGroup.hidden) {
      arrays.push({
        field: "projectIds",
        mode: projectMode.value as BulkArrayMode,
        values: selectedTomValues(projectTom),
      });
    }

    if (tagsEnabled.checked) {
      arrays.push({
        field: "tags",
        mode: tagMode.value as BulkArrayMode,
        values: selectedTomValues(tagTom),
      });
    }

    const reusableValue = readBoolean(reusable);
    const archivedValue = readBoolean(archived);

    if (
      arrays.length === 0 &&
      reusableValue === undefined &&
      archivedValue === undefined
    ) {
      state.textContent = "Нет изменений";
      return;
    }

    const items = selectedItems();

    if (items.length !== selectedIds.length) {
      state.textContent = "Часть ассетов недоступна";
      return;
    }

    const plan: BulkEditPlan = {
      arrays,
      ...(reusableValue === undefined
        ? {}
        : { reusable: reusableValue }),
      ...(archivedValue === undefined
        ? {}
        : { archived: archivedValue }),
    };

    const batch = buildBulkMetadataRequest(items, plan);

    saving = true;
    save.disabled = true;
    state.textContent = "Сохраняю…";

    try {
      const response = await fetch(
        MEDIA_DESK_BULK_METADATA_ENDPOINT,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(batch),
        },
      );

      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      for (const entry of batch) {
        sessionOverrides.set(entry.id, entry.metadata);

        document.dispatchEvent(
          new CustomEvent("media-desk:metadata-saved", {
            detail: {
              id: entry.id,
              metadata: entry.metadata,
              origin: "bulk",
            },
          }),
        );
      }

      state.textContent = `${batch.length} обновлено`;
    } catch (error) {
      state.textContent =
        error instanceof Error
          ? error.message
          : "Ошибка сохранения";
    } finally {
      saving = false;
      save.disabled = false;
    }
  });

  syncVisibility();
}
