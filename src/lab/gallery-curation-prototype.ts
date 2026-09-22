import { projects } from "../data/catalog/projects/index.ts";
import {
  getGalleryItems,
  getGalleryModelItems,
  type GalleryItem,
  type GalleryModelItem,
} from "../data/media/gallery.ts";

type Variant = "continuous" | "chapters" | "editorial" | "contact";
type Candidate = {
  id: string;
  kind: "image" | "model";
  seriesId: string;
  seriesTitle: string;
  title: string;
  src: string;
  width?: number;
  height?: number;
};

const variants: readonly Variant[] = ["continuous", "chapters", "editorial", "contact"];

function candidateSeriesTitle(seriesId: string, fallback: string): string {
  return projects.find((project) => project.id === seriesId)?.name ?? fallback;
}

function imageCandidate(item: GalleryItem): Candidate {
  return {
    id: item.id,
    kind: "image",
    seriesId: item.seriesId,
    seriesTitle: candidateSeriesTitle(item.seriesId, item.title || "Untitled series"),
    title: item.title || item.alt || item.id,
    src: item.asset.src,
    width: item.width,
    height: item.height,
  };
}

function modelCandidate(item: GalleryModelItem): Candidate {
  return {
    id: item.id,
    kind: "model",
    seriesId: item.seriesId,
    seriesTitle: "Jestei Pool 3D symbols",
    title: item.title,
    src: item.posterSrc,
  };
}

const candidates: readonly Candidate[] = [
  ...getGalleryItems().map(imageCandidate),
  ...getGalleryModelItems().map(modelCandidate),
];

const initialSelection = new Set(candidates.map((item) => item.id));
const selected = new Set(initialSelection);

function readVariant(): Variant {
  const raw = new URLSearchParams(location.search).get("variant");
  return variants.includes(raw as Variant) ? raw as Variant : "continuous";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function selectedCandidates(): readonly Candidate[] {
  return candidates.filter((candidate) => selected.has(candidate.id));
}

function seriesCounts(items: readonly Candidate[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) result[item.seriesId] = (result[item.seriesId] ?? 0) + 1;
  return result;
}

function groupedCandidates(): readonly { id: string; title: string; items: Candidate[] }[] {
  const groups = new Map<string, { title: string; items: Candidate[] }>();
  for (const item of candidates) {
    const existing = groups.get(item.seriesId);
    if (existing) existing.items.push(item);
    else groups.set(item.seriesId, { title: item.seriesTitle, items: [item] });
  }
  return [...groups].map(([id, group]) => ({ id, ...group }));
}

function cardHtml(item: Candidate): string {
  const isSelected = selected.has(item.id);
  const dimensions = item.width && item.height
    ? ` width="${item.width}" height="${item.height}"`
    : "";

  return `<article class="prototype-card" data-candidate-id="${escapeHtml(item.id)}" data-kind="${item.kind}" data-selected="${isSelected}">
    <button type="button" aria-pressed="${isSelected}" aria-label="${isSelected ? "Исключить" : "Вернуть"}: ${escapeHtml(item.title)}">
      <div class="prototype-card__media">
        <img src="${escapeHtml(item.src)}" alt="" loading="lazy" decoding="async"${dimensions}>
      </div>
      <div class="prototype-card__meta">
        <span class="prototype-card__title">${escapeHtml(item.title)}</span>
        <span class="prototype-card__toggle">${isSelected ? "keep" : "drop"}</span>
      </div>
    </button>
  </article>`;
}

function renderCanvas(): void {
  const canvas = document.querySelector<HTMLElement>("[data-prototype-canvas]");
  if (!canvas) return;

  const variant = readVariant();
  canvas.dataset.activeVariant = variant;
  canvas.innerHTML = groupedCandidates()
    .map((group) => `<section class="prototype-series" data-series-id="${escapeHtml(group.id)}">
      <h2 class="prototype-series__title">${escapeHtml(group.title)} · ${group.items.filter((item) => selected.has(item.id)).length}/${group.items.length}</h2>
      <div class="prototype-series__grid">
        ${group.items.map(cardHtml).join("")}
      </div>
    </section>`)
    .join("");

  for (const button of canvas.querySelectorAll<HTMLButtonElement>("[data-candidate-id] button")) {
    button.addEventListener("click", () => {
      const card = button.closest<HTMLElement>("[data-candidate-id]");
      const id = card?.dataset.candidateId;
      if (!id) return;
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      render();
    });
  }
}

function renderState(): void {
  const variant = readVariant();
  const items = selectedCandidates();
  const counts = seriesCounts(items);
  const state = {
    assumption: "This prototype reviews the current #1125 Gallery candidate set; it is not publication approval.",
    variant,
    selectedCount: items.length,
    selectedIds: items.map((item) => item.id),
    seriesCounts: counts,
    seriesOverThree: Object.entries(counts)
      .filter(([, count]) => count > 3)
      .map(([seriesId, count]) => ({ seriesId, count })),
  };

  const variantNode = document.querySelector<HTMLElement>("[data-state-variant]");
  const selectedNode = document.querySelector<HTMLElement>("[data-state-selected]");
  const seriesNode = document.querySelector<HTMLElement>("[data-state-series]");
  const jsonNode = document.querySelector<HTMLElement>("[data-state-json]");

  if (variantNode) variantNode.textContent = variant;
  if (selectedNode) selectedNode.textContent = `${items.length}/${candidates.length}`;
  if (seriesNode) seriesNode.textContent = String(Object.keys(counts).length);
  if (jsonNode) jsonNode.textContent = JSON.stringify(state, null, 2);

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-variant]")) {
    button.setAttribute("aria-pressed", String(button.dataset.variant === variant));
  }
}

function render(): void {
  renderCanvas();
  renderState();
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-variant]")) {
  button.addEventListener("click", () => {
    const variant = button.dataset.variant as Variant | undefined;
    if (!variant || !variants.includes(variant)) return;
    const url = new URL(location.href);
    url.searchParams.set("variant", variant);
    history.replaceState(null, "", url);
    render();
  });
}

document.querySelector<HTMLButtonElement>("[data-reset]")?.addEventListener("click", () => {
  selected.clear();
  for (const id of initialSelection) selected.add(id);
  render();
});

window.addEventListener("popstate", render);
render();
