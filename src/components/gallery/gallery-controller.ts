import { createGalleryLightbox } from "./gallery-lightbox.ts";
import { createGalleryVideoPreviews } from "./gallery-video-preview.ts";
import {
  galleryViewerHistoryTransition,
  parseGallerySearch,
  serializeGalleryState,
  type GalleryState,
  type GalleryViewerHistoryCause,
} from "./gallery-state.ts";

type Destroy = () => void;
type WritableHistoryMode = "push" | "replace";

const EMPTY_GALLERY_STATE: GalleryState = {
  itemId: null,
  slide: null,
};

function galleryUrl(state: GalleryState): string {
  return `${window.location.pathname}${serializeGalleryState(state)}${window.location.hash}`;
}

export function createGalleryController(root: HTMLElement): Destroy {
  const initialState = parseGallerySearch(window.location.search);
  let state = initialState;
  let syncingHistory = false;
  let viewerHistoryEntryOwned = false;

  const writeHistory = (next: GalleryState, mode: WritableHistoryMode): void => {
    const url = galleryUrl(next);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  };

  const applyViewerTransition = (
    nextItemId: string | null,
    nextSlide: number | null,
    cause: GalleryViewerHistoryCause,
  ): void => {
    const transition = galleryViewerHistoryTransition({
      currentItemId: state.itemId,
      currentSlide: state.slide,
      nextItemId,
      nextSlide,
      ownsViewerEntry: viewerHistoryEntryOwned,
      cause,
    });

    viewerHistoryEntryOwned = transition.ownsViewerEntry;
    if (transition.action === "none") return;
    if (transition.action === "back") {
      window.history.back();
      return;
    }

    state = { itemId: nextItemId, slide: nextItemId ? nextSlide : null };
    writeHistory(state, transition.action);
  };

  const destroyVideoPreviews = createGalleryVideoPreviews(root);

  const lightbox = createGalleryLightbox({
    root,
    onChange: (itemId, slide) => {
      if (syncingHistory) {
        state = { itemId, slide };
        return;
      }
      applyViewerTransition(itemId, slide, "viewer-change");
    },
    onClose: () => {
      if (syncingHistory || !state.itemId) return;
      applyViewerTransition(null, null, "viewer-close");
    },
  });

  const openStateItem = (nextState: GalleryState): void => {
    if (!nextState.itemId) {
      lightbox.close();
      return;
    }
    if (!lightbox.openItem(nextState.itemId, nextState.slide)) {
      state = EMPTY_GALLERY_STATE;
      if (!syncingHistory) writeHistory(state, "replace");
    }
  };

  const handlePopState = (): void => {
    const previousItemId = state.itemId;
    syncingHistory = true;
    state = parseGallerySearch(window.location.search);
    viewerHistoryEntryOwned = Boolean(!previousItemId && state.itemId);
    openStateItem(state);
    syncingHistory = false;
  };
  window.addEventListener("popstate", handlePopState);

  // A direct viewer URL owns one same-document history entry so Back closes the
  // viewer to Gallery instead of immediately ejecting the visitor from the page.
  if (initialState.itemId) {
    writeHistory(EMPTY_GALLERY_STATE, "replace");
    writeHistory(initialState, "push");
    viewerHistoryEntryOwned = true;
    requestAnimationFrame(() => openStateItem(initialState));
  } else {
    // Normalize retired query parameters such as ?layer=production away.
    writeHistory(initialState, "replace");
  }

  return () => {
    window.removeEventListener("popstate", handlePopState);
    lightbox.destroy();
    destroyVideoPreviews();
  };
}
