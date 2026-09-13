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
  const initialState = parseGallerySearch(window.location.search);
  let state = initialState;
  let syncingHistory = false;

  const writeHistory = (next: GalleryState, mode: HistoryMode): void => {
    if (mode === "none") return;
    const url = galleryUrl(next);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  const lightbox = createGalleryLightbox({
    root,
    onChange: (itemId) => {
      state = { itemId };
      if (!syncingHistory) writeHistory(state, "replace");
    },
    onClose: () => {
      if (!state.itemId) return;
      state = { itemId: null };
      if (!syncingHistory) writeHistory(state, "replace");
    },
  });

  const openStateItem = (itemId: string | null): void => {
    if (!itemId) {
      lightbox.close();
      return;
    }
    if (!lightbox.openItem(itemId)) {
      state = { itemId: null };
      if (!syncingHistory) writeHistory(state, "replace");
    }
  };

  const handlePopState = (): void => {
    syncingHistory = true;
    state = parseGallerySearch(window.location.search);
    openStateItem(state.itemId);
    syncingHistory = false;
  };
  window.addEventListener("popstate", handlePopState);

  // Normalize retired query parameters such as ?layer=production away while
  // preserving a valid deep-linked photo id.
  writeHistory(state, "replace");
  if (initialState.itemId) requestAnimationFrame(() => openStateItem(initialState.itemId));

  return () => {
    window.removeEventListener("popstate", handlePopState);
    lightbox.destroy();
  };
}
