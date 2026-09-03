import "./media-desk.css";
import "./editor.css";
import "./bulk-editor.css";
import "./text-desk.css";

import { JustifiedInfiniteGrid, MasonryInfiniteGrid } from "@egjs/infinitegrid";
import Split from "split.js";
import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  createPhotoSwipeLightbox,
  type PhotoSwipeLightboxItem,
} from "../../components/photoswipe-lightbox.ts";
import {
  filterAndSortMediaDeskItems,
  getMediaDeskIssues,
  mediaDeskCompleteness,
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
  analyzeMediaDeskItems,
  dispatchMediaAnalysisFilterIntent,
  MEDIA_ANALYSIS_FILTER_EVENT,
  type MediaAnalysisFilterIntent,
} from "./media-analysis.ts";
import { renderContentDeskTextView } from "./text-desk.ts";

const CHUNK_SIZE = 60;
const DESKTOP_BREAKPOINT = 900;
const VIEW_KEY = "media-desk:view";
const DENSITY_KEY = "media-desk:density";
const INSPECTOR_SIZE_KEY = "media-desk:inspector-size";

type ViewMode = "masonry" | "justified" | "grid";
type Density = "s" | "m" | "l" | "xl";
type InfiniteDeskGrid = MasonryInfiniteGrid | JustifiedInfiniteGrid;

const densityValues: readonly Density[] = ["s", "m", "l", "xl"];
const viewValues: readonly ViewMode[] = ["masonry", "justified", "grid"];
const masonrySizes: Record<Density, number> = { s: 150, m: 210, l: 280, xl: 360 };
const justifiedSizes: Record<Density, number> = { s: 120, m: 170, l: 230, xl: 310 };
const gridSizes: Record<Density, number> = { s: 140, m: 190, l: 250, xl: 330 };

const projectNames = new Map<string, string>(projects.map((project) => [project.id, project.name]));
const root = document.querySelector<HTMLDivElement>("#media-desk");
if (!root) throw new Error("Missing #media-desk root");

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

function storedEnum<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function enumParam<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(location.search).get(name);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

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

const params = new URLSearchParams(location.search);
const isTextView = params.get("view") === "text";
const state: Required<MediaDeskState> = {
  search: params.get("q") ?? "",
  mediaType: enumParam("type", mediaTypeValues, "all"),
  projectId: params.get("project") ?? "",
  review: enumParam("review", reviewValues, "all"),
  sort: enumParam("sort", sortValues, "recent"),
};

let viewMode = storedEnum(VIEW_KEY, viewValues, "masonry");
let density = storedEnum(DENSITY_KEY, densityValues, "m");
let filteredItems: readonly MediaCatalogItem[] = [];
let sessionItems: readonly MediaCatalogItem[] = mediaCatalogItems;
let loadedCount = 0;
let infiniteGrid: InfiniteDeskGrid | null = null;
let gridObserver: IntersectionObserver | null = null;
let splitInstance: ReturnType<typeof Split> | null = null;
let activeId: string | null = null;
let selectionAnchorId: string | null = null;
const selectedIds = new Set<string>();
const metadataOverrides = new Map<string, MediaDeskMetadataOverride>();
const lightbox = createPhotoSwipeLightbox();

function updateUrl(): void {
  const next = new URLSearchParams();
  if (isTextView) next.set("view", "text");
  if (state.search) next.set("q", state.search);
  if (state.mediaType !== "all") next.set("type", state.mediaType);
  if (state.projectId) next.set("project", state.projectId);
  if (state.review !== "all") next.set("review", state.review);
  if (state.sort !== "recent") next.set("sort", state.sort);
  const suffix = next.size > 0 ? `?${next.toString()}` : location.pathname;
  history.replaceState(null, "", suffix);
}

function projectLabel(item: MediaCatalogItem): string {
  return item.projectIds.map((id) => projectNames.get(id) ?? id).join(" · ") || "Без проекта";
}

function itemDimensions(item: MediaCatalogItem): { width: number; height: number } {
  const width = item.asset.width || 4;
  const height = item.asset.height || 3;
  return { width, height };
}

function captionHtml(item: MediaCatalogItem): string {
  const title = item.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const description = item.description
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return description ? `<strong>${title}</strong><br>${description}` : `<strong>${title}</strong>`;
}

function lightboxItems(items: readonly MediaCatalogItem[]): {
  items: PhotoSwipeLightboxItem[];
  sourceIds: string[];
} {
  const result: PhotoSwipeLightboxItem[] = [];
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
    } else if (item.asset.type === "video") {
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
  lightbox.open({ items: dataset.items, index, restoreFocus });
}

function previewNode(item: MediaCatalogItem): HTMLElement {
  const { width, height } = itemDimensions(item);
  const wrapper = element("div", "media-card__preview");
  wrapper.style.aspectRatio = `${width} / ${height}`;

  const src = item.asset.type === "image"
    ? item.asset.src
    : item.asset.type === "video"
      ? item.posterSrc
      : undefined;

  if (src) {
    const image = element("img");
    image.src = src;
    image.alt = item.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.width = width;
    image.height = height;
    wrapper.append(image);
  } else {
    const placeholder = element("div", "media-card__placeholder");
    placeholder.append(
      element("strong", undefined, item.asset.type === "model" ? "3D" : item.asset.type),
      element("span", undefined, item.asset.type === "model" ? "Model preview" : "No poster"),
    );
    wrapper.append(placeholder);
  }
  return wrapper;
}

function issueText(item: MediaCatalogItem): string {
  const issues = getMediaDeskIssues(item);
  if (item.archived) return "archived";
  if (issues.length > 0) return String(issues.length);
  const completeness = Math.round(mediaDeskCompleteness(item) * 100);
  return completeness === 100 ? "ok" : `${completeness}%`;
}

function dispatchActive(id: string): void {
  activeId = id;
  document.dispatchEvent(new CustomEvent("media-desk:asset-select", { detail: { id } }));
}

function dispatchSelection(): void {
  document.dispatchEvent(new CustomEvent("media-desk:selection-change", {
    detail: { ids: [...selectedIds] },
  }));
}

function updateSelectionDom(): void {
  document.querySelectorAll<HTMLElement>(".media-card[data-asset-id]").forEach((node) => {
    const id = node.dataset.assetId ?? "";
    node.classList.toggle("is-active", id === activeId);
    node.classList.toggle("is-selected", selectedIds.has(id));
    node.setAttribute("aria-selected", selectedIds.has(id) ? "true" : "false");
    const checkbox = node.querySelector<HTMLInputElement>(".media-card__checkbox");
    if (checkbox) checkbox.checked = selectedIds.has(id);
  });
}

function activateCard(item: MediaCatalogItem, event: MouseEvent): void {
  const id = item.asset.id;
  if (event.shiftKey) {
    const ids = filteredItems.map((entry) => entry.asset.id);
    for (const rangeId of idsBetween(ids, selectionAnchorId ?? activeId, id)) {
      selectedIds.add(rangeId);
    }
    dispatchSelection();
  } else if (event.ctrlKey || event.metaKey) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    selectionAnchorId = id;
    dispatchSelection();
  } else {
    selectionAnchorId = id;
  }
  dispatchActive(id);
  updateSelectionDom();
}

function card(item: MediaCatalogItem): HTMLElement {
  const node = element("article", "media-card");
  node.dataset.assetId = item.asset.id;
  node.tabIndex = 0;
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", item.title);
  node.setAttribute("aria-selected", selectedIds.has(item.asset.id) ? "true" : "false");
  if (activeId === item.asset.id) node.classList.add("is-active");
  if (selectedIds.has(item.asset.id)) node.classList.add("is-selected");

  node.append(previewNode(item));

  const overlay = element("div", "media-card__overlay");
  const checkbox = element("input", "media-card__checkbox");
  checkbox.type = "checkbox";
  checkbox.checked = selectedIds.has(item.asset.id);
  checkbox.setAttribute("aria-label", `Выбрать ${item.title}`);
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();
    if (checkbox.checked) selectedIds.add(item.asset.id);
    else selectedIds.delete(item.asset.id);
    selectionAnchorId = item.asset.id;
    dispatchSelection();
    updateSelectionDom();
  });

  const previewButton = element("button", "media-card__preview-action", "Preview");
  previewButton.type = "button";
  previewButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPreview(item, previewButton);
  });
  overlay.append(checkbox, previewButton);

  const body = element("div", "media-card__body");
  const title = element("h2", "media-card__title", item.title);
  const statusNode = element("span", "media-card__status", issueText(item));
  if (getMediaDeskIssues(item).length > 0 || item.archived) {
    statusNode.classList.add("media-card__status--issue");
  }
  const hoverMeta = element("div", "media-card__hover-meta");
  hoverMeta.append(
    element("span", undefined, projectLabel(item)),
    element("span", undefined, item.asset.type),
  );
  body.append(title, statusNode, hoverMeta);
  node.append(overlay, body);

  node.addEventListener("click", (event) => activateCard(item, event));
  node.addEventListener("dblclick", (event) => {
    event.preventDefault();
    openPreview(item, node);
  });
  node.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      openPreview(item, node);
    } else if (event.key === "Enter") {
      event.preventDefault();
      dispatchActive(item.asset.id);
      updateSelectionDom();
    }
  });

  return node;
}

function skeletonCard(index: number): HTMLElement {
  const ratios = [[4, 3], [3, 4], [16, 10], [1, 1], [5, 7]] as const;
  const [width, height] = ratios[index % ratios.length];
  const node = element("article", "media-card media-card--skeleton");
  const preview = element("div", "media-card__preview media-card__skeleton-block");
  preview.style.aspectRatio = `${width} / ${height}`;
  const body = element("div", "media-card__body");
  body.append(element("span", "media-card__skeleton-line"), element("span", "media-card__skeleton-line media-card__skeleton-line--short"));
  node.append(preview, body);
  return node;
}

const app = element("main", "media-desk");
app.dataset.view = viewMode;
app.dataset.density = density;

const header = element("header", "media-desk__header");
const headingGroup = element("div");
const title = element("h1", "media-desk__title", "Media Desk");
title.style.fontSize = "28px";
headingGroup.append(
  element("p", "media-desk__eyebrow", "Internal tool"),
  title,
);
const summary = element("p", "media-desk__summary");
header.append(headingGroup, summary);

const toolbar = element("div", "media-desk__toolbar");
const searchInput = element("input", "media-desk__control media-desk__search");
searchInput.type = "search";
searchInput.placeholder = "Поиск: title, tag, project, ID…";
searchInput.value = state.search;
searchInput.setAttribute("aria-label", "Поиск по медиакаталогу");

const typeSelect = element("select", "media-desk__control");
typeSelect.setAttribute("aria-label", "Тип медиа");
[
  ["all", "Все типы"],
  ["image", "Изображения"],
  ["video", "Видео"],
  ["model", "3D модели"],
].forEach(([value, label]) => typeSelect.append(option(value, label)));
typeSelect.value = state.mediaType;

const projectSelect = element("select", "media-desk__control");
projectSelect.setAttribute("aria-label", "Проект");
projectSelect.append(option("", "Все проекты"));
for (const project of [...projects].sort((a, b) => a.name.localeCompare(b.name))) {
  projectSelect.append(option(project.id, project.name));
}
projectSelect.value = state.projectId;

const reviewSelect = element("select", "media-desk__control");
reviewSelect.setAttribute("aria-label", "Состояние metadata");
[
  ["all", "Все состояния"],
  ["needs-review", "Нужна проверка"],
  ["missing-alt", "Без alt"],
  ["missing-description", "Без description"],
  ["missing-project", "Без проекта"],
  ["archived", "Архив"],
].forEach(([value, label]) => reviewSelect.append(option(value, label)));
reviewSelect.value = state.review;

const sortSelect = element("select", "media-desk__control");
sortSelect.setAttribute("aria-label", "Сортировка");
[
  ["recent", "Сначала новые"],
  ["title", "По названию"],
  ["project", "По проекту"],
  ["completeness-desc", "Metadata completeness"],
].forEach(([value, label]) => sortSelect.append(option(value, label)));
sortSelect.value = state.sort;

const viewControl = element("div", "media-desk__segmented");
viewControl.setAttribute("aria-label", "Режим раскладки");
const viewButtons = new Map<ViewMode, HTMLButtonElement>();
for (const [value, label] of [["masonry", "Masonry"], ["justified", "Rows"], ["grid", "Grid"]] as const) {
  const button = element("button", "media-desk__segmented-button", label);
  button.type = "button";
  button.dataset.value = value;
  button.classList.toggle("is-active", viewMode === value);
  viewControl.append(button);
  viewButtons.set(value, button);
}

const densityControl = element("div", "media-desk__segmented media-desk__density");
densityControl.setAttribute("aria-label", "Плотность карточек");
const densityButtons = new Map<Density, HTMLButtonElement>();
for (const value of densityValues) {
  const button = element("button", "media-desk__segmented-button", value.toUpperCase());
  button.type = "button";
  button.dataset.value = value;
  button.classList.toggle("is-active", density === value);
  densityControl.append(button);
  densityButtons.set(value, button);
}

const analysisActions: readonly { intent: MediaAnalysisFilterIntent; label: string }[] = [
  { intent: "missing-alt", label: "Missing alt" },
  { intent: "missing-description", label: "Missing description" },
  { intent: "missing-project", label: "Missing project" },
  { intent: "archived", label: "Archived" },
];
const analysisControl = element("div", "media-desk__segmented media-desk__analysis-actions");
analysisControl.setAttribute("aria-label", "Media analysis");
const analysisButtons = new Map<MediaAnalysisFilterIntent, HTMLButtonElement>();
for (const action of analysisActions) {
  const button = element("button", "media-desk__segmented-button", action.label);
  button.type = "button";
  button.dataset.analysisIntent = action.intent;
  button.addEventListener("click", () => {
    dispatchMediaAnalysisFilterIntent(document, action.intent);
  });
  analysisControl.append(button);
  analysisButtons.set(action.intent, button);
}

toolbar.append(
  searchInput,
  typeSelect,
  projectSelect,
  reviewSelect,
  analysisControl,
  sortSelect,
  viewControl,
  densityControl,
);

const status = element("div", "media-desk__status");
const statusText = element("span");
const selectionText = element("span");
status.append(statusText, selectionText);

const workspace = element("div", "media-desk__workspace");
const browserPane = element("section", "media-desk__browser");
const grid = element("div", "media-desk__grid");
grid.setAttribute("aria-live", "polite");
const sentinel = element("div", "media-desk__sentinel");
browserPane.append(grid, sentinel);

const inspector = element("aside", "media-desk__inspector");
inspector.id = "media-desk-inspector";
inspector.setAttribute("aria-label", "Media Inspector");

workspace.append(browserPane, inspector);
app.append(header, toolbar, status, workspace);
root.append(app);

function rebuildSessionItems(): void {
  sessionItems = mediaCatalogItems.map((item) => {
    const override = metadataOverrides.get(item.asset.id);
    return override ? applyMediaDeskMetadata(item, override) : item;
  });
}

function destroyLayout(): void {
  infiniteGrid?.destroy();
  infiniteGrid = null;
  gridObserver?.disconnect();
  gridObserver = null;
  grid.replaceChildren();
}

function appendGridChunk(): void {
  const next = filteredItems.slice(loadedCount, loadedCount + CHUNK_SIZE);
  if (next.length === 0) {
    sentinel.hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  next.forEach((item) => fragment.append(card(item)));
  grid.append(fragment);
  loadedCount += next.length;
  sentinel.hidden = loadedCount >= filteredItems.length;
  statusText.textContent = `${filteredItems.length} найдено · показано ${loadedCount}`;
}

function startCssGrid(): void {
  grid.classList.add("media-desk__grid--css");
  grid.style.setProperty("--media-card-min", `${gridSizes[density]}px`);
  appendGridChunk();
  gridObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) appendGridChunk();
  }, { rootMargin: "700px 0px" });
  gridObserver.observe(sentinel);
}

function startInfiniteGrid(): void {
  grid.classList.remove("media-desk__grid--css");
  const common = {
    gap: 10,
    threshold: 700,
    useResizeObserver: true,
    observeChildren: true,
    useRecycle: true,
  };
  infiniteGrid = viewMode === "masonry"
    ? new MasonryInfiniteGrid(grid, {
        ...common,
        columnSize: masonrySizes[density],
        align: "justify",
      })
    : new JustifiedInfiniteGrid(grid, {
        ...common,
        sizeRange: [
          Math.round(justifiedSizes[density] * 0.78),
          Math.round(justifiedSizes[density] * 1.22),
        ],
        columnRange: [1, 12],
      });

  const skeletonHtml = `<article class="media-card media-card--skeleton"><div class="media-card__preview media-card__skeleton-block" style="aspect-ratio:4/3"></div><div class="media-card__body"><span class="media-card__skeleton-line"></span></div></article>`;
  infiniteGrid.setPlaceholder({ html: skeletonHtml });

  const appendChunk = (groupKey: number): void => {
    const next = filteredItems.slice(loadedCount, loadedCount + CHUNK_SIZE);
    if (next.length === 0) return;
    infiniteGrid?.append(next.map(card), groupKey);
    loadedCount += next.length;
    statusText.textContent = `${filteredItems.length} найдено · показано ${loadedCount}`;
  };

  infiniteGrid.on("requestAppend", (event) => {
    event.wait();
    if (loadedCount >= filteredItems.length) {
      event.currentTarget.isReachEnd = true;
      event.ready();
      return;
    }

    const nextGroupKey = Math.floor(loadedCount / CHUNK_SIZE);
    event.currentTarget.appendPlaceholders(Math.min(8, filteredItems.length - loadedCount), nextGroupKey);
    requestAnimationFrame(() => {
      event.currentTarget.removePlaceholders({ groupKey: nextGroupKey });
      appendChunk(nextGroupKey);
      if (loadedCount >= filteredItems.length) {
        event.currentTarget.isReachEnd = true;
      }
      event.ready();
    });
  });

  appendChunk(0);
  if (loadedCount >= filteredItems.length) {
    infiniteGrid.isReachEnd = true;
  }
  infiniteGrid.renderItems();
}

function renderEmpty(): void {
  const empty = element("div", "media-desk__empty", "Ничего не найдено. Измените поиск или фильтры.");
  grid.append(empty);
  sentinel.hidden = true;
}

function renderBrowser(): void {
  rebuildSessionItems();
  filteredItems = filterAndSortMediaDeskItems(sessionItems, state, projectNames);
  loadedCount = 0;
  destroyLayout();
  app.dataset.view = viewMode;
  app.dataset.density = density;
  const analysis = analyzeMediaDeskItems(sessionItems);
  const analysisCounts: Record<MediaAnalysisFilterIntent, number> = {
    "missing-alt": analysis.missingAlt,
    "missing-description": analysis.missingDescription,
    "missing-project": analysis.missingProject,
    archived: analysis.archived,
  };
  for (const action of analysisActions) {
    const button = analysisButtons.get(action.intent);
    if (!button) continue;
    button.textContent = `${action.label} ${analysisCounts[action.intent]}`;
    button.classList.toggle("is-active", state.review === action.intent);
  }
  summary.textContent = `${analysis.total} assets · ${analysis.videoCount} video · ${analysis.archived} archived`;
  selectionText.textContent = selectedIds.size > 0 ? `${selectedIds.size} selected` : activeId ? "1 active" : "";
  statusText.textContent = `${filteredItems.length} найдено`;
  updateUrl();

  if (filteredItems.length === 0) {
    renderEmpty();
    return;
  }

  for (let index = 0; index < Math.min(10, filteredItems.length); index += 1) {
    grid.append(skeletonCard(index));
  }
  requestAnimationFrame(() => {
    grid.replaceChildren();
    if (viewMode === "grid") startCssGrid();
    else startInfiniteGrid();
    updateSelectionDom();
  });
}

function renderAfterControlChange(): void {
  scrollTo({ top: 0, behavior: "auto" });
  renderBrowser();
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderAfterControlChange();
});
typeSelect.addEventListener("change", () => {
  state.mediaType = typeSelect.value as Required<MediaDeskState>["mediaType"];
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

for (const [value, button] of viewButtons) {
  button.addEventListener("click", () => {
    viewMode = value;
    localStorage.setItem(VIEW_KEY, viewMode);
    for (const [mode, target] of viewButtons) target.classList.toggle("is-active", mode === viewMode);
    renderAfterControlChange();
  });
}
for (const [value, button] of densityButtons) {
  button.addEventListener("click", () => {
    density = value;
    localStorage.setItem(DENSITY_KEY, density);
    for (const [size, target] of densityButtons) target.classList.toggle("is-active", size === density);
    renderAfterControlChange();
  });
}

document.addEventListener(MEDIA_ANALYSIS_FILTER_EVENT, (event) => {
  const intent = (event as CustomEvent<{ intent?: MediaAnalysisFilterIntent }>).detail?.intent;
  if (!intent || !reviewValues.includes(intent)) return;
  state.review = intent;
  reviewSelect.value = state.review;
  renderAfterControlChange();
});

document.addEventListener("media-desk:selection-clear", () => {
  selectedIds.clear();
  selectionAnchorId = null;
  selectionText.textContent = activeId ? "1 active" : "";
  updateSelectionDom();
  dispatchSelection();
});

document.addEventListener("media-desk:metadata-saved", (event) => {
  const detail = (event as CustomEvent<{ id?: unknown; metadata?: unknown }>).detail;
  if (!detail || typeof detail.id !== "string" || !detail.metadata || typeof detail.metadata !== "object") {
    return;
  }
  metadataOverrides.set(detail.id, detail.metadata as MediaDeskMetadataOverride);
  if (!isTextView) renderBrowser();
});

function savedInspectorPercent(): number {
  const saved = Number.parseFloat(localStorage.getItem(INSPECTOR_SIZE_KEY) ?? "");
  return Number.isFinite(saved) && saved >= 18 && saved <= 45 ? saved : 28;
}

function syncSplit(): void {
  if (matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches) {
    if (splitInstance) return;
    const inspectorPercent = savedInspectorPercent();
    splitInstance = Split([browserPane, inspector], {
      sizes: [100 - inspectorPercent, inspectorPercent],
      minSize: [420, 320],
      gutterSize: 8,
      snapOffset: 0,
      onDragEnd: (sizes) => {
        const nextInspector = sizes[1];
        if (nextInspector !== undefined) {
          localStorage.setItem(INSPECTOR_SIZE_KEY, nextInspector.toFixed(2));
        }
      },
    });
  } else if (splitInstance) {
    splitInstance.destroy();
    splitInstance = null;
    browserPane.style.removeProperty("width");
    inspector.style.removeProperty("width");
  }
}

function appendTextWorkspaceTabs(): void {
  title.textContent = "Content Desk";
  const navigation = element("nav", "content-desk__tabs");
  navigation.setAttribute("aria-label", "Content Desk разделы");
  const mediaLink = element("a", "content-desk__tab", "Медиа");
  mediaLink.href = "/tools/media-desk/";
  const textLink = element("a", "content-desk__tab", "Тексты");
  textLink.href = "/tools/media-desk/?view=text";
  textLink.setAttribute("aria-current", "page");
  navigation.append(mediaLink, textLink);
  header.insertAdjacentElement("afterend", navigation);
}

if (isTextView) {
  workspace.hidden = true;
  toolbar.hidden = true;
  status.hidden = true;
  app.style.width = "min(100%, 1920px)";
  app.style.margin = "0 auto";
  app.style.padding = "20px";
  app.classList.remove("media-desk");
  appendTextWorkspaceTabs();
  void renderContentDeskTextView(app);
} else {
  const splitMedia = matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
  splitMedia.addEventListener("change", syncSplit);
  syncSplit();
  renderBrowser();
}

window.addEventListener("beforeunload", () => {
  lightbox.destroy();
  infiniteGrid?.destroy();
  gridObserver?.disconnect();
  splitInstance?.destroy();
});