import "../../styles/gallery.css";

import type { GalleryLayer } from "../../data/media/gallery.ts";
import { createGalleryLayout } from "./gallery-layout.ts";
import { createGalleryLightbox } from "./gallery-lightbox.ts";
import {
  parseGallerySearch,
  serializeGalleryState,
  type GalleryState,
} from "./gallery-state.ts";

type Destroy = () => void;

type HistoryMode = "push" | "replace" | "none";

function galleryUrl(state: GalleryState): string {
  return `${window.location.pathname}${serializeGalleryState(state)}${window.location.hash}`;
}

export function createGalleryController(root: HTMLElement): Destroy {
  const controls = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-layer-control]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-gallery-layer-panel]")];
  const initialState = parseGallerySearch(window.location.search);
  let state = initialState;
  let syncingHistory = false;

  const writeHistory = (next: GalleryState, mode: HistoryMode): void => {
    if (mode === "none") return;
    const url = galleryUrl(next);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  const applyLayer = (layer: GalleryLayer, mode: HistoryMode): void => {
    state = { layer, itemId: null };
    root.dataset.galleryLayer = layer;

    controls.forEach((control) => {
      const active = control.dataset.galleryLayerControl === layer;
      control.setAttribute("aria-pressed", active ? "true" : "false");
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.galleryLayerPanel !== layer;
    });

    writeHistory(state, mode);
    window.dispatchEvent(new Event("resize"));
  };

  const lightbox = createGalleryLightbox({
    root,
    onChange: (itemId) => {
      state = { ...state, itemId };
      if (!syncingHistory) writeHistory(state, "replace");
    },
    onClose: () => {
      if (!state.itemId) return;
      state = { ...state, itemId: null };
      if (!syncingHistory) writeHistory(state, "replace");
    },
  });

  const openStateItem = (itemId: string | null): void => {
    if (!itemId) {
      lightbox.close();
      return;
    }
    if (!lightbox.openItem(itemId)) {
      state = { ...state, itemId: null };
      if (!syncingHistory) writeHistory(state, "replace");
    }
  };

  const handleControlClick = (event: Event): void => {
    const control = event.currentTarget;
    if (!(control instanceof HTMLButtonElement)) return;
    const layer = control.dataset.galleryLayerControl;
    if (layer !== "photography" && layer !== "production") return;
    if (layer === state.layer && !state.itemId) return;
    lightbox.close();
    applyLayer(layer, "push");
  };

  controls.forEach((control) => control.addEventListener("click", handleControlClick));

  const handlePopState = (): void => {
    syncingHistory = true;
    const next = parseGallerySearch(window.location.search);
    applyLayer(next.layer, "none");
    state = next;
    openStateItem(next.itemId);
    syncingHistory = false;
  };
  window.addEventListener("popstate", handlePopState);

  const destroyLayout = createGalleryLayout(root);
  applyLayer(initialState.layer, "none");
  state = initialState;
  writeHistory(state, "replace");
  if (initialState.itemId) requestAnimationFrame(() => openStateItem(initialState.itemId));

  return () => {
    controls.forEach((control) => control.removeEventListener("click", handleControlClick));
    window.removeEventListener("popstate", handlePopState);
    lightbox.destroy();
    destroyLayout();
  };
}
