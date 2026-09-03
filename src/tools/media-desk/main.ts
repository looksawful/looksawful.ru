import { JustifiedInfiniteGrid } from "@egjs/infinitegrid";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  filterAndSortMediaDeskItems,
  type MediaDeskReviewFilter,
  type MediaDeskSort,
  type MediaDeskState,
} from "./model.ts";
import {
  applyMediaDeskMetadata,
  idsBetween,
  type MediaDeskMetadataOverride,
} from "./browser-layout.ts";
import {
  createDeskLightbox,
  type DeskLightboxItem,
} from "./desk-lightbox.ts";

const CHUNK_SIZE = 60;
const DENSITY_KEY = "media-desk:density";

type Density = "s" | "m" | "l" | "xl";

const densityValues: readonly Density[] = ["s", "m", "l", "xl"];

const densityConfig: Record<Density, {
  minSize: number;
  maxSize: number;
}> = {
  s: { minSize: 105, maxSize: 135 },
  m: { minSize: 150, maxSize: 190 },
  l: { minSize: 205, maxSize: 255 },
  xl: { minSize: 410, maxSize: 520 },
};

const mediaTypeValues = ["all", "image", "video", "model"] as const;
const reviewValues: readonly MediaDeskReviewFilter[] = [
  "all",
  "needs-review",
  "missing-alt",
  "missing-description",
  "missing-project",
  "archived",
];
const sortValues: readonly MediaDeskSort[] = [
  "recent",
  "title",
  "project",
  "completeness-desc",
];

const projectNames = new Map(
  projects.map((project) => [project.id, project.name]),
);

const root = document.querySelector<HTMLDivElement>("#media-desk");
if (!root) {
  throw new Error("Missing #media-desk root");
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

function option(value: string, label: string): HTMLOptionElement {
  const node = element("option");
  node.value = value;
  node.textContent = label;
  return node;
}

function enumParam<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = new URLSearchParams(location.search).get(name);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function storedEnum<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const state: Required<MediaDeskState> = {
  search: new URLSearchParams(location.search).get("q") ?? "",
  mediaType: enumParam("type", mediaTypeValues, "all"),
  projectId: new URLSearchParams(location.search).get("project") ?? "",
  review: enumParam("review", reviewValues, "all"),
  sort: enumParam("sort", sortValues, "recent"),
};

let density = storedEnum(DENSITY_KEY, densityValues, "m");
let sessionItems: readonly MediaCatalogItem[] = mediaCatalogItems;
let filteredItems: readonly MediaCatalogItem[] = [];
let loadedCount = 0;
let infiniteGrid: JustifiedInfiniteGrid | null = null;
let activeId: string | null = null;
let selectionAnchorId: string | null = null;

const selectedIds = new Set<string>();
const metadataOverrides = new Map<string, MediaDeskMetadataOverride>();
const lightbox = createDeskLightbox();

function updateUrl(): void {
  const next = new URLSearchParams();

  if (state.search) next.set("q", state.search);
  if (state.mediaType !== "all") next.set("type", state.mediaType);
  if (state.projectId) next.set("project", state.projectId);
  if (state.review !== "all") next.set("review", state.review);
  if (state.sort !== "recent") next.set("sort", state.sort);

  history.replaceState(
    null,
    "",
    next.size > 0 ? `?${next.toString()}` : location.pathname,
  );
}

function projectLabel(item: MediaCatalogItem): string {
  return item.projectIds
    .map((id) => projectNames.get(id) ?? id)
    .join(" · ") || "Без проекта";
}

function currentItem(id: string): MediaCatalogItem | null {
  const canonical = mediaCatalogItems.find((item) => item.asset.id === id);
  if (!canonical) return null;

  const override = metadataOverrides.get(id);
  return override ? applyMediaDeskMetadata(canonical, override) : canonical;
}

function itemDimensions(item: MediaCatalogItem): {
  width: number;
  height: number;
} {
  return {
    width: item.asset.width || 4,
    height: item.asset.height || 3,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function captionHtml(item: MediaCatalogItem): string {
  const title = escapeHtml(item.title || item.asset.id);
  const project = escapeHtml(projectLabel(item));
  const type = escapeHtml(item.asset.type);
  const description = escapeHtml(item.description);

  return [
    '<div class="md-lightbox-caption">',
    `<strong>${title}</strong>`,
    `<span>${project} · ${type}</span>`,
    description ? `<p>${description}</p>` : "",
    "</div>",
  ].join("");
}

function lightboxItems(
  items: readonly MediaCatalogItem[],
): {
  items: DeskLightboxItem[];
  sourceIds: string[];
} {
  const result: DeskLightboxItem[] = [];
  const sourceIds: string[] = [];

  for (const item of items) {
    const { width, height } = itemDimensions(item);

    if (item.asset.type === "image") {
      result.push({
        kind: "image",
        src: item.asset.src,
        width,
        height,
        captionHtml: captionHtml(item),
      });
      sourceIds.push(item.asset.id);
      continue;
    }

    if (item.asset.type === "video") {
      result.push({
        kind: "video",
        type: "video",
        html: "",
        src: item.asset.src,
        poster: item.posterSrc ?? "",
        width,
        height,
        loop: true,
        resumeAt: 0,
        captionHtml: captionHtml(item),
      });
      sourceIds.push(item.asset.id);
    }
  }

  return { items: result, sourceIds };
}

function openPreview(item: MediaCatalogItem, restoreFocus: HTMLElement): void {
  const dataset = lightboxItems(filteredItems);
  const index = dataset.sourceIds.indexOf(item.asset.id);
  if (index < 0) return;

  lightbox.open({
    items: dataset.items,
    index,
    restoreFocus,
  });
}

function cardPreview(item: MediaCatalogItem): HTMLElement {
  const { width, height } = itemDimensions(item);
  const surface = element("div", "md-card__surface");
  surface.style.aspectRatio = `${width} / ${height}`;

  const src =
    item.asset.type === "image"
      ? item.asset.src
      : item.asset.type === "video"
        ? item.posterSrc
        : undefined;

  if (src) {
    const image = element("img", "md-card__image");
    image.src = src;
    image.alt = item.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.width = width;
    image.height = height;
    image.dataset.gridMaintainedTarget = "true";
    surface.append(image);
    return surface;
  }

  surface.dataset.gridMaintainedTarget = "true";
  const placeholder = element(
    "div",
    "md-card__placeholder",
    item.asset.type === "model" ? "3D" : "No preview",
  );
  surface.append(placeholder);
  return surface;
}

function dispatchActive(id: string): void {
  activeId = id;
  document.dispatchEvent(
    new CustomEvent("media-desk:asset-select", { detail: { id } }),
  );
}

function dispatchSelection(): void {
  document.dispatchEvent(
    new CustomEvent("media-desk:selection-change", {
      detail: { ids: [...selectedIds] },
    }),
  );
}

function syncSelectionDom(): void {
  grid
    .querySelectorAll<HTMLElement>(".md-card[data-asset-id]")
    .forEach((cardNode) => {
      const id = cardNode.dataset.assetId ?? "";
      const selected = selectedIds.has(id);

      cardNode.classList.toggle("is-active", id === activeId);
      cardNode.classList.toggle("is-selected", selected);
      cardNode.setAttribute("aria-selected", selected ? "true" : "false");

      const checkbox =
        cardNode.querySelector<HTMLInputElement>(".md-card__check");
      if (checkbox) checkbox.checked = selected;
    });
}

function activateCard(item: MediaCatalogItem, event: MouseEvent): void {
  const id = item.asset.id;
  let selectionChanged = false;

  if (event.shiftKey) {
    const ids = filteredItems.map((entry) => entry.asset.id);
    for (const rangeId of idsBetween(
      ids,
      selectionAnchorId ?? activeId,
      id,
    )) {
      if (!selectedIds.has(rangeId)) {
        selectedIds.add(rangeId);
        selectionChanged = true;
      }
    }
    selectionAnchorId = id;
  } else if (event.ctrlKey || event.metaKey) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    selectionAnchorId = id;
    selectionChanged = true;
  } else {
    if (selectedIds.size > 0) {
      selectedIds.clear();
      selectionChanged = true;
    }
    selectionAnchorId = id;
  }

  if (selectionChanged) {
    dispatchSelection();
  }

  dispatchActive(id);
  renderPreview(currentItem(id));
  syncSelectionDom();
}

function card(item: MediaCatalogItem): HTMLElement {
  const node = element("article", "md-card");
  node.dataset.assetId = item.asset.id;
  node.tabIndex = 0;
  node.setAttribute("role", "option");
  node.setAttribute("aria-label", item.title || item.asset.id);
  node.setAttribute(
    "aria-selected",
    selectedIds.has(item.asset.id) ? "true" : "false",
  );

  if (activeId === item.asset.id) node.classList.add("is-active");
  if (selectedIds.has(item.asset.id)) node.classList.add("is-selected");

  const preview = cardPreview(item);

  const actions = element("div", "md-card__actions");

  const checkbox = element("input", "md-card__check");
  checkbox.type = "checkbox";
  checkbox.checked = selectedIds.has(item.asset.id);
  checkbox.setAttribute("aria-label", `Выбрать ${item.title || item.asset.id}`);
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();

    if (checkbox.checked) {
      selectedIds.add(item.asset.id);
    } else {
      selectedIds.delete(item.asset.id);
    }

    selectionAnchorId = item.asset.id;
    dispatchSelection();
    syncSelectionDom();
  });

  const openButton = element("button", "md-card__open", "Открыть");
  openButton.type = "button";
  openButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPreview(item, openButton);
  });

  actions.append(checkbox, openButton);

  const text = element("div", "md-card__text");
  text.append(
    element("strong", "md-card__title", item.title || item.asset.id),
    element("span", "md-card__meta", projectLabel(item)),
  );

  node.append(preview, actions, text);

  node.addEventListener("click", (event) => {
    activateCard(item, event);
  });

  node.addEventListener("dblclick", (event) => {
    event.preventDefault();
    openPreview(item, node);
  });

  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      dispatchActive(item.asset.id);
      renderPreview(currentItem(item.asset.id));
      syncSelectionDom();
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      openPreview(item, node);
    }
  });

  return node;
}

const shell = element("main", "md-shell");

const previewPane = element("aside", "md-preview");
previewPane.setAttribute("aria-label", "Предпросмотр выбранного ассета");
const previewHeader = element("header", "md-pane-header");
previewHeader.append(element("span", "md-pane-title", "Preview"));
const previewBody = element("div", "md-preview__body");
previewPane.append(previewHeader, previewBody);

const center = element("section", "md-center");
center.setAttribute("aria-label", "Галерея");

const toolbar = element("header", "md-toolbar");

const searchInput = element("input", "md-control md-search");
searchInput.type = "search";
searchInput.placeholder = "Поиск";
searchInput.value = state.search;
searchInput.setAttribute("aria-label", "Поиск по медиакаталогу");

const typeSelect = element("select", "md-control");
typeSelect.setAttribute("aria-label", "Тип медиа");
[
  ["all", "Все типы"],
  ["image", "Изображения"],
  ["video", "Видео"],
  ["model", "3D"],
].forEach(([value, label]) => typeSelect.append(option(value, label)));
typeSelect.value = state.mediaType;

const projectSelect = element("select", "md-control md-project-filter");
projectSelect.setAttribute("aria-label", "Проект");
projectSelect.append(option("", "Все проекты"));
for (const project of [...projects].sort((a, b) =>
  a.name.localeCompare(b.name)
)) {
  projectSelect.append(option(project.id, project.name));
}
projectSelect.value = state.projectId;

const reviewSelect = element("select", "md-control");
reviewSelect.setAttribute("aria-label", "Состояние metadata");
[
  ["all", "Все состояния"],
  ["needs-review", "Нужна проверка"],
  ["missing-alt", "Без alt"],
  ["missing-description", "Без подписи"],
  ["missing-project", "Без проекта"],
  ["archived", "Архив"],
].forEach(([value, label]) => reviewSelect.append(option(value, label)));
reviewSelect.value = state.review;

const sortSelect = element("select", "md-control");
sortSelect.setAttribute("aria-label", "Сортировка");
[
  ["recent", "Сначала новые"],
  ["title", "По названию"],
  ["project", "По проекту"],
  ["completeness-desc", "По заполненности"],
].forEach(([value, label]) => sortSelect.append(option(value, label)));
sortSelect.value = state.sort;

const densityControl = element("div", "md-density");
densityControl.setAttribute("aria-label", "Размер миниатюр");

const densityButtons = new Map<Density, HTMLButtonElement>();
for (const value of densityValues) {
  const button = element("button", "md-density__button", value.toUpperCase());
  button.type = "button";
  button.dataset.value = value;
  button.classList.toggle("is-active", value === density);
  densityControl.append(button);
  densityButtons.set(value, button);
}

toolbar.append(
  searchInput,
  typeSelect,
  projectSelect,
  reviewSelect,
  sortSelect,
  densityControl,
);

const status = element("div", "md-status");
const statusText = element("span");
const selectionText = element("span");
status.append(statusText, selectionText);

const galleryScroll = element("div", "md-gallery-scroll");
galleryScroll.id = "media-desk-scroll";

const grid = element("div", "md-grid");
grid.setAttribute("role", "listbox");
grid.setAttribute("aria-label", "Медиакаталог");
grid.setAttribute("aria-multiselectable", "true");
galleryScroll.append(grid);

center.append(toolbar, status, galleryScroll);

const properties = element("aside", "md-properties");
properties.setAttribute("aria-label", "Свойства ассета");
const propertiesHeader = element("header", "md-pane-header");
const propertiesBack = element("button", "md-properties-back", "← Галерея");
propertiesBack.type = "button";
const propertiesTitle = element("span", "md-pane-title", "Properties");
propertiesHeader.append(propertiesBack, propertiesTitle);
const propertiesBody = element("div", "md-properties__body");
const inspectorHost = element("div", "md-inspector-host");
inspectorHost.id = "media-desk-inspector";
const bulkHost = element("div", "md-bulk-host");
bulkHost.id = "media-desk-bulk";
bulkHost.hidden = true;
propertiesBody.append(inspectorHost, bulkHost);
properties.append(propertiesHeader, propertiesBody);
properties.dataset.open = "false";

shell.append(previewPane, center, properties);
root.replaceChildren(shell);

propertiesBack.addEventListener("click", () => {
  properties.dataset.open = "false";
});

document.addEventListener("media-desk:asset-select", () => {
  properties.dataset.open = "true";
});

function renderPreview(item: MediaCatalogItem | null): void {
  previewBody.replaceChildren();

  if (!item) {
    const empty = element("div", "md-preview-empty");
    empty.append(
      element("strong", undefined, "Выберите ассет"),
      element("span", undefined, "Предпросмотр появится здесь"),
    );
    previewBody.append(empty);
    return;
  }

  const stage = element("div", "md-preview-stage");
  const src =
    item.asset.type === "image"
      ? item.asset.src
      : item.asset.type === "video"
        ? item.posterSrc
        : undefined;

  if (src) {
    const media =
      item.asset.type === "video"
        ? element("video", "md-preview-media")
        : element("img", "md-preview-media");

    if (media instanceof HTMLVideoElement) {
      media.src = item.asset.src;
      media.poster = item.posterSrc ?? "";
      media.controls = true;
      media.muted = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media.src = src;
      media.alt = item.alt;
      media.decoding = "async";
    }

    stage.append(media);
  } else {
    stage.append(
      element(
        "div",
        "md-preview-placeholder",
        item.asset.type === "model" ? "3D asset" : "Preview unavailable",
      ),
    );
  }

  const info = element("div", "md-preview-info");
  info.append(
    element("strong", "md-preview-title", item.title || item.asset.id),
    element(
      "span",
      "md-preview-meta",
      `${projectLabel(item)} · ${item.asset.type}`,
    ),
  );

  const open = element("button", "md-button md-button--wide", "Открыть крупно");
  open.type = "button";
  open.addEventListener("click", () => openPreview(item, open));

  previewBody.append(stage, info, open);
}

function rebuildSessionItems(): void {
  sessionItems = mediaCatalogItems.map((item) => {
    const override = metadataOverrides.get(item.asset.id);
    return override ? applyMediaDeskMetadata(item, override) : item;
  });
}

function destroyGrid(): void {
  infiniteGrid?.destroy();
  infiniteGrid = null;
  grid.replaceChildren();
}

function startGrid(): void {
  const config = densityConfig[density];

  infiniteGrid = new JustifiedInfiniteGrid(grid, {
    scrollContainer: galleryScroll,
    gap: 10,
    threshold: 700,
    useResizeObserver: false,
    observeChildren: false,
    useRecycle: true,
    sizeRange: [config.minSize, config.maxSize],
    columnRange: [1, 12],
  });

  const appendChunk = (groupKey: number): void => {
    const next = filteredItems.slice(
      loadedCount,
      loadedCount + CHUNK_SIZE,
    );

    if (next.length === 0) return;

    infiniteGrid?.append(next.map(card), groupKey);
    loadedCount += next.length;
    statusText.textContent =
      `${filteredItems.length} найдено · показано ${loadedCount}`;
  };

  infiniteGrid.on("requestAppend", (event) => {
    if (loadedCount >= filteredItems.length) {
      event.currentTarget.isReachEnd = true;
      return;
    }

    const nextGroupKey = Math.floor(loadedCount / CHUNK_SIZE);
    appendChunk(nextGroupKey);

    if (loadedCount >= filteredItems.length) {
      event.currentTarget.isReachEnd = true;
    }
  });

  appendChunk(0);

  if (loadedCount >= filteredItems.length) {
    infiniteGrid.isReachEnd = true;
  }

  infiniteGrid.renderItems();
}

function renderEmpty(): void {
  const empty = element(
    "div",
    "md-empty",
    "Ничего не найдено. Измените поиск или фильтры.",
  );
  grid.append(empty);
}

function renderBrowser(options: { preserveScroll?: boolean } = {}): void {
  const previousScrollTop = galleryScroll.scrollTop;

  rebuildSessionItems();
  filteredItems = filterAndSortMediaDeskItems(
    sessionItems,
    state,
    projectNames,
  );

  loadedCount = 0;
  destroyGrid();
  updateUrl();

  statusText.textContent = `${filteredItems.length} найдено`;
  selectionText.textContent =
    selectedIds.size > 0
      ? `${selectedIds.size} выбрано`
      : activeId
        ? "1 активен"
        : "";

  if (filteredItems.length === 0) {
    renderEmpty();
    return;
  }

  startGrid();
  syncSelectionDom();

  if (options.preserveScroll) {
    galleryScroll.scrollTop = previousScrollTop;
  }
}

function renderAfterControlChange(): void {
  galleryScroll.scrollTo({ top: 0, behavior: "auto" });
  renderBrowser();
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderAfterControlChange();
});

typeSelect.addEventListener("change", () => {
  state.mediaType =
    typeSelect.value as Required<MediaDeskState>["mediaType"];
  renderAfterControlChange();
});

projectSelect.addEventListener("change", () => {
  state.projectId = projectSelect.value;
  renderAfterControlChange();
});

reviewSelect.addEventListener("change", () => {
  state.review = reviewSelect.value as MediaDeskReviewFilter;
  renderAfterControlChange();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value as MediaDeskSort;
  renderAfterControlChange();
});

for (const [value, button] of densityButtons) {
  button.addEventListener("click", () => {
    density = value;
    localStorage.setItem(DENSITY_KEY, density);

    for (const [size, target] of densityButtons) {
      target.classList.toggle("is-active", size === density);
    }

    renderAfterControlChange();
  });
}

document.addEventListener("media-desk:selection-clear", () => {
  selectedIds.clear();
  selectionAnchorId = null;
  dispatchSelection();
  syncSelectionDom();
});

document.addEventListener("media-desk:selection-change", (event) => {
  const ids =
    (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];

  selectionText.textContent =
    ids.length > 0
      ? `${ids.length} выбрано`
      : activeId
        ? "1 активен"
        : "";

  propertiesTitle.textContent = ids.length > 1 ? "Bulk edit" : "Properties";

  if (ids.length > 1) {
    properties.dataset.open = "true";
  }
});

document.addEventListener("media-desk:metadata-saved", (event) => {
  const detail = (
    event as CustomEvent<{
      id?: unknown;
      metadata?: unknown;
    }>
  ).detail;

  if (
    !detail ||
    typeof detail.id !== "string" ||
    !detail.metadata ||
    typeof detail.metadata !== "object"
  ) {
    return;
  }

  metadataOverrides.set(
    detail.id,
    detail.metadata as MediaDeskMetadataOverride,
  );

  if (activeId === detail.id) {
    renderPreview(currentItem(detail.id));
  }

  renderBrowser({ preserveScroll: true });
});

renderPreview(null);
renderBrowser();

window.addEventListener("beforeunload", () => {
  lightbox.destroy();
  infiniteGrid?.destroy();
});
