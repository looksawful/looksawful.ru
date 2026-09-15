import { createMediaLightbox } from "../../components/media-lightbox.ts";
import { sensetiqueOlovoBookletGroup } from "../../data/content/sensetique.ts";
import { renderMediaGroup } from "../../templates/media-group.ts";

const renderFixture = () => `<section class="project">${renderMediaGroup(sensetiqueOlovoBookletGroup)}</section>`;

const mountLightbox = (canvasElement) => createMediaLightbox({ root: canvasElement });

const meta = {
  title: "03 Organisms/Media Lightbox",
  tags: ["autodocs", "stable", "project:sensetique"],
  render: renderFixture,
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/components/media-lightbox.ts",
        "src/components/photoswipe-lightbox.ts",
        "src/data/content/sensetique.ts",
        "src/templates/media-group.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "closed",
      visibility: ["overlay"],
      interaction: ["closed", "open", "focus-visible"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses canonical Sensetique OLOVO booklet data, the production media-group renderer and the production Media Lightbox/PhotoSwipe runtime. Pointer, keyboard, overlay and focus behavior remain owned by production code.",
      },
    },
  },
};

export default meta;

export const Closed = {
  play: ({ canvasElement }) => {
    mountLightbox(canvasElement);
  },
};

export const OverlayOpen = {
  play: ({ canvasElement }) => {
    mountLightbox(canvasElement);
    const source = canvasElement.querySelector("[data-lightbox-source]");
    if (source instanceof HTMLElement) source.click();
  },
  parameters: {
    looksawful: {
      state: "overlay-open",
      interaction: ["open"],
    },
  },
};

export const KeyboardOpen = {
  play: ({ canvasElement }) => {
    mountLightbox(canvasElement);
    const source = canvasElement.querySelector("[data-lightbox-source]");
    if (!(source instanceof HTMLElement)) return;
    source.focus();
    source.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  },
  parameters: {
    looksawful: {
      state: "keyboard-open",
      interaction: ["open", "focus-visible"],
    },
  },
};
