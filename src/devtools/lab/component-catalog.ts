import {
  CONTENT_BLOCK_TYPES,
  type ContentBlockType,
} from "../../content/contracts/content-block.ts";
import type { LabLifecycle } from "./types.ts";

export type LabComponentClass = "generic" | "specialized" | "runtime";
export type LabPreviewKind = "content-block" | "page-context" | "runtime-state";

export interface LabComponentCatalogEntry {
  id: string;
  label: string;
  class: LabComponentClass;
  lifecycle: LabLifecycle;
  source: string;
  previewKind: LabPreviewKind;
  labVisible: true;
}

const CONTENT_BLOCK_SOURCES: Record<ContentBlockType, string> = {
  "code-block": "src/components/content/code-block.ts",
  "media-figure": "src/components/content/media-figure.ts",
  "media-group": "src/components/content/media-group.ts",
  "media-slider": "src/components/content/media-slider.ts",
  mockup: "src/components/content/mockup.ts",
  "mockup-deck": "src/components/content/mockup-deck.ts",
  "justified-gallery": "src/components/content/justified-gallery.ts",
  "before-after": "src/components/content/before-after.ts",
  "page-flip": "src/components/content/page-flip.ts",
  "animated-canvas-gallery": "src/components/specialized/animated-canvas-gallery.ts",
  "jestei-theme": "src/components/specialized/jestei-theme.ts",
  "awful-cases-game": "src/components/specialized/awful-cases-game.ts",
};

const SPECIALIZED_CONTENT_BLOCKS = new Set<ContentBlockType>([
  "animated-canvas-gallery",
  "jestei-theme",
  "awful-cases-game",
]);

function labelFromId(id: string): string {
  return id
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

const contentBlockEntries: readonly LabComponentCatalogEntry[] = CONTENT_BLOCK_TYPES.map(
  (id) => ({
    id,
    label: labelFromId(id),
    class: SPECIALIZED_CONTENT_BLOCKS.has(id) ? "specialized" : "generic",
    lifecycle: id === "awful-cases-game" ? "hidden" : "live",
    source: CONTENT_BLOCK_SOURCES[id],
    previewKind: "content-block",
    labVisible: true,
  }),
);

const standaloneEntries: readonly LabComponentCatalogEntry[] = [
  {
    id: "hero",
    label: "Hero",
    class: "specialized",
    lifecycle: "live",
    source: "src/site/renderers/home/home-slots.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "site-navigation",
    label: "Site Navigation",
    class: "generic",
    lifecycle: "live",
    source: "src/site/shell/navigation.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "project-navigator",
    label: "Project Navigator",
    class: "generic",
    lifecycle: "live",
    source: "src/site/navigation/model.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "entity-intro",
    label: "Entity Intro",
    class: "generic",
    lifecycle: "live",
    source: "src/components/composition/entity-intro.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "home-expertise",
    label: "Home Expertise",
    class: "specialized",
    lifecycle: "live",
    source: "src/components/expertise.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "home-experience",
    label: "Home Experience",
    class: "specialized",
    lifecycle: "live",
    source: "src/components/experience.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "contact-footer",
    label: "Contact / Footer",
    class: "specialized",
    lifecycle: "live",
    source: "src/site/renderers/home/home-page.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "media-lightbox",
    label: "Media Lightbox",
    class: "runtime",
    lifecycle: "live",
    source: "src/components/media-lightbox.ts",
    previewKind: "runtime-state",
    labVisible: true,
  },
  {
    id: "berserk-audio-player",
    label: "Berserk Audio Player",
    class: "specialized",
    lifecycle: "hidden",
    source: "src/components/berserk-audio-player.ts",
    previewKind: "runtime-state",
    labVisible: true,
  },
  {
    id: "jestei-track-filter",
    label: "Jestei Track Filter",
    class: "specialized",
    lifecycle: "live",
    source: "src/components/specialized/jestei-track-filter-canonical.ts",
    previewKind: "page-context",
    labVisible: true,
  },
  {
    id: "moves-canvas-demo",
    label: "Moves Canvas Demo",
    class: "specialized",
    lifecycle: "hidden",
    source: "src/components/specialized/moves-canvas-demo.ts",
    previewKind: "page-context",
    labVisible: true,
  },
];

export const LAB_COMPONENT_CATALOG: readonly LabComponentCatalogEntry[] = [
  ...contentBlockEntries,
  ...standaloneEntries,
];
