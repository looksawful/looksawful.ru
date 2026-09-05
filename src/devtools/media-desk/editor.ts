/// <reference types="vite/client" />

import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.css";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  mediaCatalogDeliverables,
  mediaCatalogProjectTypes,
  mediaCatalogWorkAreas,
} from "../../data/taxonomy/media-taxonomy.ts";
import {
  applyMediaEditorialPatchToItem,
  buildMediaEditorialPatch,
  mediaEditorialWritePatchForOrigin,
} from "./editor-serialization.ts";
import {
  pickMediaEditorialMetadata,
  type MediaEditorialPatch,
} from "./editor-model.ts";
import { connectMediaDeskBulkEditor } from "./bulk-editor.ts";

const CAN_WRITE_MEDIA = import.meta.env.VITE_CONTENT_DESK_WRITE === "1";
const editorialOverrides = new Map<string, Partial<MediaEditorialPatch>>();

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

function currentEditorItem(item: MediaCatalogItem): MediaCatalogItem {
  const override = editorialOverrides.get(item.asset.id);
  return override ? applyMediaEditorialPatchToItem(item, override) : item;
}

function field(
  label: string,
  control: HTMLElement,
  className = "",
): HTMLLabelElement {
  const wrapper = element(
    "label",
    `md-field${className ? ` ${className}` : ""}`,
  );
  wrapper.append(element("span", "md-field__label", label), control);
  return wrapper;
}

function textField(
  label: string,
  value: string,
  options: {
    multiline?: boolean;
    rows?: number;
    compact?: boolean;
  } = {},
): {
  field: HTMLLabelElement;
  control: HTMLInputElement | HTMLTextAreaElement;
} {
  const control = options.multiline
    ? element("textarea", "md-input md-textarea")
    : element("input", "md-input");

  control.value = value;

  if (control instanceof HTMLTextAreaElement) {
    control.rows = options.rows ?? 3;
  }

  return {
    field: field(
      label,
      control,
      options.compact ? "md-field--compact" : "",
    ),
    control,
  };
}

function group(
  title: string,
  options: { open?: boolean; description?: string } = {},
): HTMLDetailsElement {
  const details = element("details", "md-editor-group");
  details.open = options.open ?? true;

  const summary = element("summary", "md-editor-group__summary");
  summary.append(element("span", undefined, title));

  if (options.description) {
    summary.append(
      element("small", undefined, options.description),
    );
  }

  details.append(summary);
  return details;
}

function taxonomyField(
  label: string,
  values: readonly string[],
  options: readonly {
    readonly id: string;
    readonly name: string;
  }[],
): {
  field: HTMLLabelElement;
  tom: TomSelect;
} {
  const select = element("select", "md-select");
  select.multiple = true;

  for (const item of options) {
    const option = element("option");
    option.value = item.id;
    option.textContent = item.name;
    option.selected = values.includes(item.id);
    select.append(option);
  }

  const wrapper = field(label, select);

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

  return { field: wrapper, tom };
}

function listField(
  label: string,
  values: readonly string[],
  suggestions: readonly string[],
): {
  field: HTMLLabelElement;
  tom: TomSelect;
} {
  const input = element("input", "md-input");
  const wrapper = field(label, input);

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

  return { field: wrapper, tom };
}

function tomValues(control: TomSelect): string[] {
  const value = control.getValue();

  return (Array.isArray(value) ? value : value.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function technicalGroup(item: MediaCatalogItem): HTMLDetailsElement {
  const details = group("Technical", { open: false });
  const list = element("dl", "md-technical");

  const values: Array<[string, string]> = [
    ["Asset ID", item.asset.id],
    ["Source", item.asset.src],
    ["Type", item.asset.type],
    [
      "Dimensions",
      item.asset.width && item.asset.height
        ? `${item.asset.width} × ${item.asset.height}`
        : "—",
    ],
    ["Duration", item.durationSeconds ? `${item.durationSeconds}s` : "—"],
    ["MIME", item.mimeType || "—"],
    ["Bytes", item.byteLength ? item.byteLength.toLocaleString() : "—"],
  ];

  if (item.asset.type === "video" && item.asset.sourceSrc) {
    values.splice(2, 0, ["Master", item.asset.sourceSrc]);
  }

  for (const [label, value] of values) {
    list.append(
      element("dt", undefined, label),
      element("dd", undefined, value),
    );
  }

  details.append(list);
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
    unsaved: "Есть изменения",
    saving: "Сохраняю…",
    error: "Ошибка",
  };

  form.dataset.saveState = state;
  saveButton.disabled = state === "saving" || !CAN_WRITE_MEDIA;
  stateNode.textContent = message
    ? `${labels[state]} · ${message}`
    : labels[state];
}

function buildMediaEditor(item: MediaCatalogItem): EditorSession {
  const metadata = pickMediaEditorialMetadata(item);
  const form = element("form", "md-editor");
  const tomControls: TomSelect[] = [];

  const texts = group("Тексты", { open: true });
  const textGrid = element("div", "md-editor-grid");

  const title = textField("Название", metadata.title);
  const date = textField("Дата / период", metadata.date, { compact: true });
  const description = textField(
    "Подпись / описание",
    metadata.description,
    { multiline: true, rows: 4 },
  );
  const alt = textField(
    "Alt",
    metadata.alt,
    { multiline: true, rows: 3 },
  );

  textGrid.append(
    title.field,
    date.field,
    description.field,
    alt.field,
  );
  texts.append(textGrid);

  const creditsGroup = group("Credits & tags", { open: true });
  const creditsGrid = element("div", "md-editor-grid");

  const creditSuggestions = mediaCatalogItems.flatMap(
    (candidate) => candidate.credits,
  );
  const credits = listField(
    "Credits",
    metadata.credits,
    creditSuggestions,
  );

  const tagSuggestions = mediaCatalogItems.flatMap(
    (candidate) => candidate.tags,
  );
  const tags = listField(
    "Теги",
    metadata.tags,
    tagSuggestions,
  );

  tomControls.push(credits.tom, tags.tom);
  creditsGrid.append(credits.field, tags.field);
  creditsGroup.append(creditsGrid);

  const classification = group("Классификация", {
    open: false,
    ...(item.origin === "registered"
      ? { description: "Проекты принадлежат конкретным размещениям MediaEntry, а не библиотечному ассету." }
      : {}),
  });
  const classificationGrid = element("div", "md-editor-grid");

  const project = item.origin === "cms"
    ? taxonomyField(
        "Проекты",
        metadata.projectIds,
        projects.map(({ id, name }) => ({ id, name })),
      )
    : null;
  const workArea = taxonomyField(
    "Направления",
    metadata.workAreaIds,
    mediaCatalogWorkAreas.map(({ id, name }) => ({ id, name })),
  );
  const projectType = taxonomyField(
    "Тип проекта",
    metadata.projectTypeIds,
    mediaCatalogProjectTypes.map(({ id, name }) => ({ id, name })),
  );
  const deliverable = taxonomyField(
    "Результаты",
    metadata.deliverableIds,
    mediaCatalogDeliverables.map(({ id, name }) => ({ id, name })),
  );

  if (project) tomControls.push(project.tom);
  tomControls.push(
    workArea.tom,
    projectType.tom,
    deliverable.tom,
  );

  if (project) classificationGrid.append(project.field);
  classificationGrid.append(
    workArea.field,
    projectType.field,
    deliverable.field,
  );
  classification.append(classificationGrid);

  const statusGroup = group("Статус", { open: false });
  const statusGrid = element("div", "md-check-grid");

  const showInCatalog = element("label", "md-check");
  const showInCatalogInput = element("input");
  showInCatalogInput.type = "checkbox";
  showInCatalogInput.checked = metadata.showInCatalog;
  showInCatalog.append(
    showInCatalogInput,
    document.createTextNode("Показывать в галерее"),
  );

  const reusable = element("label", "md-check");
  const reusableInput = element("input");
  reusableInput.type = "checkbox";
  reusableInput.checked = metadata.reusable;
  reusable.append(
    reusableInput,
    document.createTextNode("Можно переиспользовать"),
  );

  const archived = element("label", "md-check");
  const archivedInput = element("input");
  archivedInput.type = "checkbox";
  archivedInput.checked = metadata.archived;
  archived.append(
    archivedInput,
    document.createTextNode("В архиве"),
  );

  statusGrid.append(showInCatalog, reusable, archived);
  statusGroup.append(statusGrid);

  const actions = element("footer", "md-editor-actions");
  const stateNode = element("span", "md-save-state");
  const save = element("button", "md-button md-button--primary", "Сохранить");
  save.type = "submit";

  if (!CAN_WRITE_MEDIA) {
    stateNode.textContent = "Read only";
    save.disabled = true;
  }

  actions.append(stateNode, save);

  form.append(
    texts,
    creditsGroup,
    classification,
    statusGroup,
    technicalGroup(item),
    actions,
  );

  let saveState: SaveState = "saved";

  const updateState = (next: SaveState, message?: string): void => {
    saveState = next;
    setState(form, stateNode, save, next, message);
  };

  updateState("saved");

  const markDirty = (): void => {
    if (saveState !== "saving") {
      updateState("unsaved");
    }
  };

  form.addEventListener("input", markDirty);
  form.addEventListener("change", markDirty);
  for (const control of tomControls) {
    control.on("change", markDirty);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!CAN_WRITE_MEDIA || saveState === "saving") {
      return;
    }

    const next = buildMediaEditorialPatch({
      title: title.control.value,
      alt: alt.control.value,
      description: description.control.value,
      date: date.control.value,
      projectIds: project ? tomValues(project.tom) : metadata.projectIds,
      workAreaIds: tomValues(workArea.tom),
      projectTypeIds: tomValues(projectType.tom),
      deliverableIds: tomValues(deliverable.tom),
      tags: tomValues(tags.tom),
      credits: tomValues(credits.tom),
      showInCatalog: showInCatalogInput.checked,
      reusable: reusableInput.checked,
      archived: archivedInput.checked,
    });
    const writePatch = mediaEditorialWritePatchForOrigin(next, item.origin);

    updateState("saving");

    try {
      const response = await fetch("/__media-desk/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: item.asset.id,
          metadata: writePatch,
        }),
      });

      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      editorialOverrides.set(item.asset.id, next);
      updateState("saved");

      document.dispatchEvent(
        new CustomEvent("media-desk:metadata-saved", {
          detail: {
            id: item.asset.id,
            metadata: next,
            origin: "single",
          },
        }),
      );
    } catch (error) {
      updateState(
        "error",
        error instanceof Error ? error.message : "Ошибка сохранения",
      );
    }
  });

  return {
    item,
    form,
    getState: () => saveState,
    destroy: () => {
      for (const control of tomControls) {
        control.destroy();
      }
    },
  };
}

const inspector = document.querySelector<HTMLElement>("#media-desk-inspector");
const bulkHost = document.querySelector<HTMLElement>("#media-desk-bulk");

if (inspector && bulkHost) {
  let active: EditorSession | null = null;
  let selectionCount = 0;

  const showEmpty = (): void => {
    inspector.replaceChildren(
      element(
        "div",
        "md-properties-empty",
        "Выберите ассет, чтобы редактировать его свойства.",
      ),
    );
  };

  const rebuild = (id: string): void => {
    const canonical = mediaCatalogItems.find(
      (candidate) => candidate.asset.id === id,
    );
    if (!canonical) return;

    active?.destroy();
    active = buildMediaEditor(currentEditorItem(canonical));
    inspector.replaceChildren(active.form);
  };

  const open = (id: string): void => {
    if (!id || selectionCount > 1) return;

    if (active?.item.asset.id === id) {
      if (active.getState() === "unsaved") return;
      rebuild(id);
      return;
    }

    if (
      active?.getState() === "unsaved" &&
      !window.confirm(
        "Переключиться и потерять несохранённые изменения?",
      )
    ) {
      return;
    }

    rebuild(id);
  };

  showEmpty();
  connectMediaDeskBulkEditor(bulkHost);

  document.addEventListener("media-desk:selection-change", (event) => {
    const ids =
      (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];

    selectionCount = ids.length;
    const bulkMode = selectionCount > 1;

    inspector.hidden = bulkMode;
    bulkHost.hidden = !bulkMode;

    if (!bulkMode && ids.length === 1) {
      open(ids[0] ?? "");
    }
  });

  document.addEventListener("media-desk:asset-select", (event) => {
    const id =
      (event as CustomEvent<{ id?: string }>).detail?.id;

    if (id) open(id);
  });

  document.addEventListener("media-desk:metadata-saved", (event) => {
    const detail = (
      event as CustomEvent<{
        id?: string;
        metadata?: Partial<MediaEditorialPatch>;
        origin?: "single" | "bulk";
      }>
    ).detail;

    if (detail?.id && detail.metadata) {
      editorialOverrides.set(detail.id, detail.metadata);
    }

    if (
      detail?.origin === "bulk" &&
      detail.id &&
      active?.item.asset.id === detail.id &&
      active.getState() === "saved"
    ) {
      rebuild(detail.id);
    }
  });
}
