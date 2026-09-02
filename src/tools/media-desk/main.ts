import "./media-desk.css";

import { projects } from "../../data/catalog/projects/index.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../../data/media/catalog.ts";
import {
  filterAndSortMediaDeskItems,
  getMediaDeskIssues,
  mediaDeskCompleteness,
  type MediaDeskReviewFilter,
  type MediaDeskSort,
  type MediaDeskState,
} from "./model.ts";

const PAGE_SIZE = 60;
const projectNames = new Map<string, string>(projects.map((project) => [project.id, project.name]));
const root = document.querySelector<HTMLDivElement>("#media-desk");

if (!root) throw new Error("Missing #media-desk root");

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

function enumParam<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(location.search).get(name);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const params = new URLSearchParams(location.search);
const state: Required<MediaDeskState> = {
  search: params.get("q") ?? "",
  mediaType: enumParam("type", mediaTypeValues, "all"),
  projectId: params.get("project") ?? "",
  review: enumParam("review", reviewValues, "all"),
  sort: enumParam("sort", sortValues, "recent"),
};
let page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

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

function updateUrl(): void {
  const next = new URLSearchParams();
  if (params.get("view") === "text") next.set("view", "text");
  if (state.search) next.set("q", state.search);
  if (state.mediaType !== "all") next.set("type", state.mediaType);
  if (state.projectId) next.set("project", state.projectId);
  if (state.review !== "all") next.set("review", state.review);
  if (state.sort !== "recent") next.set("sort", state.sort);
  if (page > 1) next.set("page", String(page));
  const suffix = next.size > 0 ? `?${next.toString()}` : location.pathname;
  history.replaceState(null, "", suffix);
}

function projectLabel(item: MediaCatalogItem): string {
  return item.projectIds.map((id) => projectNames.get(id) ?? id).join(" · ") || "Без проекта";
}

function formatDimensions(item: MediaCatalogItem): string {
  const { width, height } = item.asset;
  return width && height ? `${width}×${height}` : "—";
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function previewNode(item: MediaCatalogItem): HTMLElement {
  const wrapper = element("div", "media-card__preview");
  if (item.asset.type === "image") {
    const image = element("img");
    image.src = item.asset.src;
    image.alt = item.alt;
    image.loading = "lazy";
    image.decoding = "async";
    wrapper.append(image);
    return wrapper;
  }

  if (item.asset.type === "video" && item.posterSrc) {
    const image = element("img");
    image.src = item.posterSrc;
    image.alt = item.alt;
    image.loading = "lazy";
    image.decoding = "async";
    wrapper.append(image);
    return wrapper;
  }

  const placeholder = element("div", "media-card__placeholder");
  placeholder.append(
    element("strong", undefined, item.asset.type),
    element("span", undefined, "Preview opens on demand"),
  );
  wrapper.append(placeholder);
  return wrapper;
}

const app = element("main", "media-desk");
const header = element("header", "media-desk__header");
const headingGroup = element("div");
headingGroup.append(
  element("p", "media-desk__eyebrow", "Internal tool · read only"),
  element("h1", "media-desk__title", "Media Desk"),
);
const summary = element("p", "media-desk__summary");
header.append(headingGroup, summary);

const toolbar = element("div", "media-desk__toolbar");
const searchInput = element("input", "media-desk__control");
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

toolbar.append(searchInput, typeSelect, projectSelect, reviewSelect, sortSelect);

const status = element("div", "media-desk__status");
const statusText = element("span");
const pageText = element("span");
status.append(statusText, pageText);

const grid = element("section", "media-desk__grid");
grid.setAttribute("aria-live", "polite");

const pagination = element("nav", "media-desk__pagination");
pagination.setAttribute("aria-label", "Пагинация медиакаталога");
const prevButton = element("button", "media-desk__button", "Назад");
prevButton.type = "button";
const nextButton = element("button", "media-desk__button", "Дальше");
nextButton.type = "button";
const paginationText = element("span");
pagination.append(prevButton, paginationText, nextButton);

const dialog = element("dialog", "media-desk__dialog");
app.append(header, toolbar, status, grid, pagination, dialog);
root.append(app);

function closeDialog(): void {
  const video = dialog.querySelector("video");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  dialog.close();
  dialog.replaceChildren();
}

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDialog();
});

function detailRow(list: HTMLDListElement, label: string, value: string): void {
  list.append(element("dt", undefined, label), element("dd", undefined, value || "—"));
}

function openDetail(item: MediaCatalogItem): void {
  dialog.replaceChildren();
  const shell = element("div", "media-desk__dialog-shell");
  const preview = element("div", "media-desk__dialog-preview");

  if (item.asset.type === "image") {
    const image = element("img");
    image.src = item.asset.src;
    image.alt = item.alt;
    image.decoding = "async";
    preview.append(image);
  } else if (item.asset.type === "video") {
    const video = element("video");
    video.controls = true;
    video.preload = "metadata";
    video.src = item.asset.src;
    if (item.posterSrc) video.poster = item.posterSrc;
    preview.append(video);
  } else {
    preview.append(element("div", "media-card__placeholder", "3D model preview is intentionally not loaded here."));
  }

  const content = element("section", "media-desk__dialog-content");
  const head = element("div", "media-desk__dialog-head");
  const title = element("h2", "media-desk__dialog-title", item.title);
  const close = element("button", "media-desk__dialog-close", "Закрыть");
  close.type = "button";
  close.addEventListener("click", closeDialog);
  head.append(title, close);

  const details = element("dl", "media-desk__details");
  detailRow(details, "Asset ID", item.asset.id);
  detailRow(details, "Origin", item.origin);
  detailRow(details, "Type", item.asset.type);
  detailRow(details, "Project", projectLabel(item));
  detailRow(details, "Dimensions", formatDimensions(item));
  detailRow(details, "Duration", item.durationSeconds ? `${item.durationSeconds.toFixed(2)} s` : "—");
  detailRow(details, "Size", formatBytes(item.byteLength));
  detailRow(details, "Date", item.date);
  detailRow(details, "Alt", item.alt);
  detailRow(details, "Description", item.description);
  detailRow(details, "Work areas", item.workAreaIds.join(", "));
  detailRow(details, "Project types", item.projectTypeIds.join(", "));
  detailRow(details, "Deliverables", item.deliverableIds.join(", "));
  detailRow(details, "Tags", item.tags.join(", "));
  detailRow(details, "Credits", item.credits.join(" · "));
  detailRow(details, "Reusable", item.reusable ? "yes" : "no");
  detailRow(details, "Archived", item.archived ? "yes" : "no");
  detailRow(details, "Completeness", `${Math.round(mediaDeskCompleteness(item) * 100)}%`);
  detailRow(details, "Review issues", getMediaDeskIssues(item).join(", ") || "none");

  const actions = element("div", "media-desk__dialog-actions");
  const copyId = element("button", "media-desk__button", "Copy asset ID");
  copyId.type = "button";
  copyId.addEventListener("click", async () => {
    await navigator.clipboard.writeText(item.asset.id);
    copyId.textContent = "Copied";
  });
  const sourceLink = element("a", "media-desk__button media-desk__link", "Open source");
  sourceLink.href = item.asset.src;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  actions.append(copyId, sourceLink);

  content.append(head, details, actions);
  shell.append(preview, content);
  dialog.append(shell);
  dialog.showModal();
}

function card(item: MediaCatalogItem): HTMLButtonElement {
  const node = element("button", "media-card");
  node.type = "button";
  node.addEventListener("click", () => openDetail(item));
  node.append(previewNode(item));

  const body = element("div", "media-card__body");
  body.append(element("h2", "media-card__title", item.title));

  const meta = element("div", "media-card__meta");
  for (const value of [item.asset.type, projectLabel(item), formatDimensions(item)]) {
    meta.append(element("span", "media-card__chip", value));
  }

  const flags = element("div", "media-card__flags");
  const completeness = Math.round(mediaDeskCompleteness(item) * 100);
  flags.append(element("span", "media-card__chip", `${completeness}% metadata`));
  for (const issue of getMediaDeskIssues(item)) {
    flags.append(element("span", "media-card__chip media-card__chip--issue", issue));
  }
  if (item.archived) flags.append(element("span", "media-card__chip media-card__chip--issue", "archived"));

  body.append(meta, flags);
  node.append(body);
  return node;
}

function render(): void {
  const filtered = filterAndSortMediaDeskItems(mediaCatalogItems, state, projectNames);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  summary.textContent = `${mediaCatalogItems.length} assets · ${mediaCatalogItems.filter((item) => item.asset.type === "video").length} video · ${mediaCatalogItems.filter((item) => item.archived).length} archived`;
  statusText.textContent = `${filtered.length} найдено · показывается ${visible.length}`;
  pageText.textContent = `Страница ${page} из ${pages}`;
  paginationText.textContent = `${page} / ${pages}`;
  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= pages;

  grid.replaceChildren();
  if (visible.length === 0) {
    grid.append(element("div", "media-desk__empty", "Ничего не найдено. Измените поиск или фильтры."));
  } else {
    const fragment = document.createDocumentFragment();
    visible.forEach((item) => fragment.append(card(item)));
    grid.append(fragment);
  }
  updateUrl();
}

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  page = 1;
  render();
});
typeSelect.addEventListener("change", () => {
  state.mediaType = typeSelect.value as Required<MediaDeskState>["mediaType"];
  page = 1;
  render();
});
projectSelect.addEventListener("change", () => {
  state.projectId = projectSelect.value;
  page = 1;
  render();
});
reviewSelect.addEventListener("change", () => {
  state.review = reviewSelect.value as MediaDeskReviewFilter;
  page = 1;
  render();
});
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value as MediaDeskSort;
  page = 1;
  render();
});
prevButton.addEventListener("click", () => {
  if (page > 1) {
    page -= 1;
    render();
    scrollTo({ top: 0, behavior: "smooth" });
  }
});
nextButton.addEventListener("click", () => {
  page += 1;
  render();
  scrollTo({ top: 0, behavior: "smooth" });
});

render();
