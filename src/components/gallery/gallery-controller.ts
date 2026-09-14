import { createGalleryLightbox } from "./gallery-lightbox.ts";
import { createGalleryMasonry } from "./gallery-masonry.ts";
import {
  galleryViewerHistoryTransition,
  parseGallerySearch,
  serializeGalleryState,
  type GalleryState,
  type GalleryViewerHistoryCause,
} from "./gallery-state.ts";

type Destroy = () => void;
type WritableHistoryMode = "push" | "replace";

function galleryUrl(state: GalleryState): string {
  return `${window.location.pathname}${serializeGalleryState(state)}${window.location.hash}`;
}

export function createGalleryController(root: HTMLElement): Destroy {
  const initialState = parseGallerySearch(window.location.search);
  let state = initialState;
  let syncingHistory = false;
  let viewerHistoryEntryOwned = false;

  const masonry = createGalleryMasonry(root);

  const writeHistory = (next: GalleryState, mode: WritableHistoryMode): void => {
    const url = galleryUrl(next);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  const applyViewerTransition = (
    nextItemId: string | null,
    cause: GalleryViewerHistoryCause,
  ): void => {
    const transition = galleryViewerHistoryTransition({
      currentItemId: state.itemId,
      nextItemId,
      ownsViewerEntry: viewerHistoryEntryOwned,
      cause,
    });

    viewerHistoryEntryOwned = transition.ownsViewerEntry;
    if (transition.action === "none") return;
    if (transition.action === "back") {
      window.history.back();
      return;
    }

    state = { itemId: nextItemId };
    writeHistory(state, transition.action);
  };

  const lightbox = createGalleryLightbox({
    root,
    onChange: (itemId) => {
      if (syncingHistory) {
        state = { itemId };
        return;
      }
      applyViewerTransition(itemId, "viewer-change");
    },
    onClose: () => {
      if (syncingHistory || !state.itemId) return;
      applyViewerTransition(null, "viewer-close");
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
    const previousItemId = state.itemId;
    syncingHistory = true;
    state = parseGallerySearch(window.location.search);
    viewerHistoryEntryOwned = Boolean(!previousItemId && state.itemId);
    openStateItem(state.itemId);
    syncingHistory = false;
  };
  window.addEventListener("popstate", handlePopState);

  // Normalize retired query parameters such as ?layer=production away while
  // preserving a valid deep-linked media id.
  writeHistory(state, "replace");
  if (initialState.itemId) requestAnimationFrame(() => openStateItem(initialState.itemId));

  return () => {
    window.removeEventListener("popstate", handlePopState);
    lightbox.destroy();
    masonry.destroy();
  };
}
