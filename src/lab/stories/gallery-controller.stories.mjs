import { createGalleryController } from "../../components/gallery/gallery-controller.ts";
import { getPageByPath } from "../../site/pages/manifest.ts";
import { extractElementContainingMarker } from "../../site/rendering/html.ts";
import { renderGalleryPage } from "../../site/renderers/gallery-page.ts";
import { cases } from "../../data/catalog/cases.ts";
import { contextualMediaCatalogItems } from "../../data/media/catalog-view.ts";
import { resolveGalleryCuration } from "../../data/media/gallery-curation.ts";
import { renderGalleryResolvedSeries } from "../../components/gallery/gallery-markup.ts";

const jesteiCaseName = cases.find(({ id }) => id === "jestei-pool")?.name;
if (!jesteiCaseName) {
  throw new Error("Canonical Jestei Pool Case identity is unavailable");
}

const galleryPage = getPageByPath("/gallery/");
if (!galleryPage || galleryPage.type !== "gallery") {
  throw new Error("Canonical Gallery SitePage is unavailable");
}

const galleryMarkup = extractElementContainingMarker(
  renderGalleryPage(galleryPage),
  "section",
  "data-gallery",
);

const mixedMediaPlacements = resolveGalleryCuration([
  {
    id: "jestei-track-filter-proof",
    projectId: "jestei-track-filter",
    placements: [
      { assetId: "jestei-08-source-05-407x425", featured: true },
      { assetId: "jestei-13-source-01-16x9" },
      {
        assetId: "jestei-08-source-11-637x419",
        slideAssetIds: ["jestei-10-source-09-449x337"],
      },
    ],
  },
], contextualMediaCatalogItems);

const mixedMediaMarkup = `<section class="gallery" data-gallery>
  <h1 class="visually-hidden">Галерея</h1>
  <div class="gallery__content">
    ${renderGalleryResolvedSeries({
      id: "jestei-track-filter-proof",
      projectLabel: jesteiCaseName,
      placements: mixedMediaPlacements,
    })}
  </div>
</section>`;

const storyUrl = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

const setGalleryLocation = (itemId = null) => {
  const previous = storyUrl();
  const next = itemId ? `/gallery/?item=${encodeURIComponent(itemId)}` : "/gallery/";
  window.history.replaceState(null, "", next);
  return () => window.history.replaceState(null, "", previous);
};

const galleryRoot = (canvasElement) => {
  const root = canvasElement.querySelector("[data-gallery]");
  if (!(root instanceof HTMLElement)) throw new Error("Gallery story root is missing");
  return root;
};

const firstCard = (canvasElement) => {
  const card = canvasElement.querySelector("[data-gallery-card]");
  if (!(card instanceof HTMLElement)) throw new Error("Gallery story has no photo card");
  return card;
};

const initialize = (context, itemId = null) => {
  const restoreLocation = setGalleryLocation(itemId);
  const destroy = createGalleryController(galleryRoot(context.canvasElement));
  return () => {
    destroy();
    restoreLocation();
  };
};

let activeCleanup = () => {};

const registerCleanup = (cleanup) => {
  activeCleanup();
  activeCleanup = cleanup;
};

const resetCleanup = () => {
  activeCleanup();
  activeCleanup = () => {};
};

export default {
  title: "03 Organisms/Gallery Controller",
  beforeEach: () => {
    resetCleanup();
    return () => resetCleanup();
  },
  tags: ["autodocs", "stable", "a11y-reviewed"],
  render: () => galleryMarkup,
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/site/renderers/gallery-page.ts",
        "src/components/gallery/gallery-controller.ts",
        "src/components/gallery/gallery-lightbox.ts",
        "src/components/gallery/gallery-state.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "gallery-closed",
      visibility: ["always", "overlay"],
      interaction: ["closed", "focus-visible", "selected"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: true, indexable: true },
    },
  },
};

export const Closed = {
  play: (context) => {
    registerCleanup(initialize(context));
  },
};

export const OpenKeyboard = {
  play: (context) => {
    registerCleanup(initialize(context));
    const card = firstCard(context.canvasElement);
    card.focus();
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  },
  parameters: {
    looksawful: {
      state: "gallery-open-keyboard",
      interaction: ["open", "focus-visible", "selected"],
    },
  },
};

export const OpenPointer = {
  play: (context) => {
    registerCleanup(initialize(context));
    firstCard(context.canvasElement).click();
  },
  parameters: {
    looksawful: {
      state: "gallery-open-pointer",
      interaction: ["open", "active-or-pressed", "selected"],
    },
  },
};

export const DeepLinked = {
  play: (context) => {
    const card = firstCard(context.canvasElement);
    const itemId = card.dataset.galleryItemId;
    if (!itemId) throw new Error("Gallery story card has no stable item id");
    registerCleanup(initialize(context, itemId));
  },
  parameters: {
    looksawful: {
      state: "gallery-deep-linked",
      interaction: ["open", "selected"],
    },
  },
};


export const MixedMedia = {
  render: () => mixedMediaMarkup,
  play: (context) => {
    registerCleanup(initialize(context));
  },
  parameters: {
    looksawful: {
      state: "gallery-mixed-media",
      interaction: ["closed", "focus-visible", "selected"],
      data: ["image", "video", "multi-slide"],
    },
  },
};

export const MixedVideoFocusedPreview = {
  render: () => mixedMediaMarkup,
  play: async (context) => {
    registerCleanup(initialize(context));
    const card = context.canvasElement.querySelector('[data-gallery-item-id="jestei-13-source-01-16x9"]');
    if (!(card instanceof HTMLElement)) throw new Error("Mixed Gallery story has no video card");

    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    card.focus();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const preview = card.querySelector("[data-gallery-video-preview]");
    if (!(preview instanceof HTMLVideoElement)) throw new Error("Mixed Gallery story has no preview video");
    if (!card.hasAttribute("data-gallery-video-previewing")) {
      throw new Error("Keyboard focus did not start Gallery video preview");
    }
    if (!preview.muted) throw new Error("Gallery video preview must stay muted");
  },
  parameters: {
    looksawful: {
      state: "gallery-mixed-video-focus-preview",
      interaction: ["focus-visible", "selected"],
      data: ["video"],
    },
  },
};

export const MixedVideoOpen = {
  render: () => mixedMediaMarkup,
  play: (context) => {
    registerCleanup(initialize(context));
    const card = context.canvasElement.querySelector('[data-gallery-item-id="jestei-13-source-01-16x9"]');
    if (!(card instanceof HTMLElement)) throw new Error("Mixed Gallery story has no video card");
    card.focus();
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  },
  parameters: {
    looksawful: {
      state: "gallery-mixed-video-open",
      interaction: ["open", "focus-visible", "selected"],
      data: ["video"],
    },
  },
};

export const DeepLinkedSlide = {
  render: () => mixedMediaMarkup,
  play: (context) => {
    const previous = storyUrl();
    window.history.replaceState(
      null,
      "",
      "/gallery/?item=jestei-08-source-11-637x419&slide=2",
    );
    const destroy = createGalleryController(galleryRoot(context.canvasElement));
    registerCleanup(() => {
      destroy();
      window.history.replaceState(null, "", previous);
    });
  },
  parameters: {
    looksawful: {
      state: "gallery-deep-linked-slide",
      interaction: ["open", "selected"],
      data: ["multi-slide"],
    },
  },
};
