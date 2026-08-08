import "@fontsource-variable/rubik/wght.css";

import "./styles/index.css";

import "./components/awfulface/awfulface.css";
import "./components/cursor-trail/cursor-trail.css";
import "./components/hero/hero.css";
import "./components/cv-accordion/cv-accordion.css";
import "./components/media-slider/media-slider.css";
import "./components/before-after/before-after.css";
import "./components/app-promo/app-promo.css";
import "./components/browser-promo/browser-promo.css";
import "./components/digital-scroll-gallery/digital-scroll-gallery.css";
import "./components/awful-tools-preview/awful-tools-preview.css";
import "./components/moves-awful/moves-awful.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery-preview.css";
import "./components/repository-link/repository-link.css";
import "./components/media-marquee/media-marquee.css";
import "./components/brief/brief.css";
import "./components/detail-panel/detail-panel.css";
import "./components/jestei-theme-organism/jestei-theme-organism.css";
import "./components/jestei-theme-organism/jestei-theme-organism-embed.css";
import "./components/infinite-reel/infinite-reel.css";
import "./components/content-blocks/content-blocks.css";

import "./components/playlist-filter-workflow/playlist-filter-workflow.js";
import "./components/awful-tools-preview/awful-tools-preview.js";

import { createDigitalScrollGalleries } from "./components/digital-scroll-gallery/digital-scroll-gallery.js";
import { createCvAccordion } from "./components/cv-accordion/cv-accordion.js";
import { resolveCvDetailPanelTheme } from "./components/cv-accordion/cv-detail-panel-theme.js";
import { createHero } from "./components/hero/hero.js";
import { createMediaSliders } from "./components/media-slider/media-slider.js";
import { createBeforeAfters } from "./components/before-after/before-after.js";
import { createMediaMarquees } from "./components/media-marquee/media-marquee.js";
import { createInfiniteReels } from "./components/infinite-reel/infinite-reel.js";
import { createMotionPreference } from "./motion-preference.js";
import { createAnimatedCanvasGalleries } from "./components/animated-canvas-gallery/animated-canvas-gallery.js";
import { createAnimatedCanvasGalleryPreviews } from "./components/animated-canvas-gallery/animated-canvas-gallery-preview.js";
import { ANIMATED_CANVAS_GALLERY_SOURCES } from "./content/animated-canvas-gallery-sources.js";
import { applyAccordionContent } from "./content/accordion-content.js";
import { createDetailPanel } from "./components/detail-panel/detail-panel.js";
import { createJesteiThemeOrganisms } from "./components/jestei-theme-organism/jestei-theme-organism.js";
import { createJesteiThemeOrganismDetailRenderer } from "./components/jestei-theme-organism/jestei-theme-organism-detail-renderer.js";

let motionPreference = null;
let destroyHero = null;
let destroyMediaSliders = null;
let destroyBeforeAfters = null;
let destroyMediaMarquees = null;
let destroyInfiniteReels = null;
let destroyDigitalScrollGalleries = null;
let destroyCvAccordion = null;
let destroyAnimatedCanvasGalleryPreviews = null;
let destroyAnimatedCanvasGalleries = null;
let destroyJesteiThemeOrganisms = null;
let destroyDetailPanel = null;
let domReadyHandler = null;

function unmount() {
  destroyDetailPanel?.();
  destroyDetailPanel = null;

  destroyJesteiThemeOrganisms?.destroy?.();
  destroyJesteiThemeOrganisms = null;

  destroyAnimatedCanvasGalleries?.();
  destroyAnimatedCanvasGalleries = null;

  destroyAnimatedCanvasGalleryPreviews?.();
  destroyAnimatedCanvasGalleryPreviews = null;

  destroyCvAccordion?.();
  destroyCvAccordion = null;

  destroyDigitalScrollGalleries?.();
  destroyDigitalScrollGalleries = null;

  destroyMediaMarquees?.();
  destroyMediaMarquees = null;

  destroyInfiniteReels?.();
  destroyInfiniteReels = null;

  destroyBeforeAfters?.();
  destroyBeforeAfters = null;

  destroyMediaSliders?.();
  destroyMediaSliders = null;

  destroyHero?.();
  destroyHero = null;

  motionPreference?.destroy();
  motionPreference = null;
}

function mount() {
  unmount();

  applyAccordionContent(document);
  motionPreference = createMotionPreference();

  destroyHero = createHero({ root: document, motion: motionPreference });
  destroyMediaSliders = createMediaSliders({ root: document, motion: motionPreference });
  destroyBeforeAfters = createBeforeAfters({ root: document, motion: motionPreference });
  destroyMediaMarquees = createMediaMarquees({ root: document, motion: motionPreference });
  destroyInfiniteReels = createInfiniteReels({ root: document, motion: motionPreference });
  destroyDigitalScrollGalleries = createDigitalScrollGalleries({ root: document });
  destroyCvAccordion = createCvAccordion({ root: document, motion: motionPreference });
  destroyAnimatedCanvasGalleryPreviews = createAnimatedCanvasGalleryPreviews({ root: document });
  destroyAnimatedCanvasGalleries = createAnimatedCanvasGalleries({
    root: document,
    sources: ANIMATED_CANVAS_GALLERY_SOURCES,
  });
  destroyJesteiThemeOrganisms = createJesteiThemeOrganisms({
    root: document,
    motion: motionPreference,
  });
  destroyDetailPanel = createDetailPanel({
    root: document,
    motion: motionPreference,
    resolveTheme: resolveCvDetailPanelTheme,
    renderers: {
      "editorial-policy": {
        minInlineSize: "42rem",
        preferredInlineSize: "64rem",
        maxInlineSize: "72rem",
      },
      "jestei-theme-organism": createJesteiThemeOrganismDetailRenderer({
        motion: motionPreference,
        inlineRuntime: destroyJesteiThemeOrganisms,
      }),
    },
  });
}

function handlePageShow(event) {
  if (event.persisted) mount();
}

if (document.readyState === "loading") {
  domReadyHandler = () => {
    domReadyHandler = null;
    mount();
  };

  document.addEventListener("DOMContentLoaded", domReadyHandler, { once: true });
} else {
  mount();
}

window.addEventListener("pagehide", unmount);
window.addEventListener("pageshow", handlePageShow);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (domReadyHandler) {
      document.removeEventListener("DOMContentLoaded", domReadyHandler);
      domReadyHandler = null;
    }

    window.removeEventListener("pagehide", unmount);
    window.removeEventListener("pageshow", handlePageShow);
    unmount();
  });
}
