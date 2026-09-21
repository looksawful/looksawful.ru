import { createGalleryController } from "../../components/gallery/gallery-controller.ts";
import { getPageByPath } from "../../site/pages/manifest.ts";
import { extractElementContainingMarker } from "../../site/rendering/html.ts";
import { renderGalleryPage } from "../../site/renderers/gallery-page.ts";

const galleryPage = getPageByPath("/gallery/");
if (!galleryPage || galleryPage.type !== "gallery") {
  throw new Error("Canonical Gallery SitePage is unavailable");
}

const galleryMarkup = extractElementContainingMarker(
  renderGalleryPage(galleryPage),
  "section",
  "data-gallery",
);

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
